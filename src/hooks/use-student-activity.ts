import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RouterLog } from '@/services/log-service';
import { Json } from '@/integrations/supabase/types';

export type ActivityStatus = 'active' | 'idle' | 'hesitant' | 'persistent' | 'struggling';

interface StudentActivityResult {
  status: ActivityStatus;
  lastActivityTime: Date | null;
  inactiveTime: string;
  taskProgress: number;
  helpRequested: boolean;
  acknowledgeHelp: () => void;
  onInteraction: (logType: string) => void;
}

export function useStudentActivity(sourceIp: string): StudentActivityResult {
  const [events, setEvents] = useState<Date[]>([]);
  const [helpRequested, setHelpRequested] = useState(false);
  const [taskProgress, setTaskProgress] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<ActivityStatus>('idle');
  const [inactiveTime, setInactiveTime] = useState('');
  const channelRef = useRef<any>(null);
  
  // Format inactive time string (10s, 2m, 1h)
  const formatInactiveTime = useCallback((date: Date | null) => {
    if (!date) return 'No activity';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    }
  }, []);
  
  // Helper function to extract button name from Json content
  const getButtonName = (content: Json | null): string | null => {
    if (!content) return null;
    
    if (typeof content === 'object' && content !== null) {
      // If content is an object, try to access buttonName property
      const contentObject = content as Record<string, any>;
      return contentObject.buttonName || null;
    }
    
    return null;
  };
  
  // Supabase realtime subscription
  useEffect(() => {
    if (!sourceIp) return;
    
    // Create a channel for this student's IP
    const channel = supabase
      .channel(`student-${sourceIp}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'router_logs',
          filter: `source_ip=eq.${sourceIp}`
        },
        (payload) => {
          const log = payload.new as RouterLog;
          const now = new Date();
          
          // Add to events list
          setEvents(prev => [now, ...prev.slice(0, 29)]);
          setLastActivityTime(now);
          
          // Check for help request
          if (
            log.log_type === 'HelpRequest' || 
            log.log_type === 'MenuButton' || 
            log.log_type === 'MessageButton'
          ) {
            const buttonName = getButtonName(log.content);
            if (
              typeof buttonName === 'string' && 
              buttonName.toLowerCase().includes('help')
            ) {
              setHelpRequested(true);
            }
          }
          
          // Update task progress
          setTaskProgress(prev => {
            let increment = 5;
            if (log.log_type === 'PortAdded') {
              increment = 20;
            }
            return Math.min(prev + increment, 100);
          });
        }
      )
      .subscribe();
    
    // Store channel reference
    channelRef.current = channel;
    
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        const { data } = await supabase
          .from('router_logs')
          .select('*')
          .eq('source_ip', sourceIp)
          .order('timestamp', { ascending: false })
          .limit(30);
        
        if (data && data.length > 0) {
          const timestamps = data.map(log => new Date(log.timestamp));
          setEvents(timestamps);
          setLastActivityTime(timestamps[0] || null);
          
          // Check for help requests in existing logs
          const hasHelp = data.some(log => {
            const buttonName = getButtonName(log.content);
            return (
              (log.log_type === 'HelpRequest' || 
               log.log_type === 'MenuButton' || 
               log.log_type === 'MessageButton') && 
              typeof buttonName === 'string' && 
              buttonName.toLowerCase().includes('help')
            );
          });
          
          setHelpRequested(hasHelp);
        }
      } catch (error) {
        console.error('Error fetching initial logs:', error);
      }
    };
    
    fetchInitialData();
    
    // Cleanup subscription
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sourceIp]);
  
  // Update status every 5 seconds
  useEffect(() => {
    const determineStatus = () => {
      const now = new Date();
      
      if (helpRequested) {
        return 'struggling';
      }
      
      if (events.length === 0) {
        return 'idle';
      }
      
      // Check for idle (no events for 3+ minutes)
      if (lastActivityTime) {
        const diffInMinutes = (now.getTime() - lastActivityTime.getTime()) / 1000 / 60;
        if (diffInMinutes >= 3) {
          return 'idle';
        }
      }
      
      // Count events in last 10 seconds
      const recentEvents = events.filter(
        time => (now.getTime() - time.getTime()) / 1000 < 10
      );
      
      if (recentEvents.length >= 2) {
        return 'active';
      }
      
      // Count events in last 60 seconds
      const eventsLastMinute = events.filter(
        time => (now.getTime() - time.getTime()) / 1000 < 60
      );
      
      if (eventsLastMinute.length >= 1 && eventsLastMinute.length <= 3) {
        // Check for gaps
        const sortedEvents = [...eventsLastMinute].sort((a, b) => a.getTime() - b.getTime());
        
        for (let i = 1; i < sortedEvents.length; i++) {
          const gap = (sortedEvents[i].getTime() - sortedEvents[i-1].getTime()) / 1000;
          if (gap >= 20) {
            return 'hesitant';
          }
        }
      }
      
      // Check for persistent (steady low-rate)
      const eventsLast2Minutes = events.filter(
        time => (now.getTime() - time.getTime()) / 1000 < 120
      );
      
      if (eventsLast2Minutes.length > 0) {
        // Group events by 30 second windows
        let windowCount = 0;
        for (let i = 0; i < 4; i++) {
          const windowStart = now.getTime() - (i + 1) * 30 * 1000;
          const windowEnd = now.getTime() - i * 30 * 1000;
          
          const eventsInWindow = events.filter(
            time => time.getTime() >= windowStart && time.getTime() < windowEnd
          );
          
          if (eventsInWindow.length > 0) {
            windowCount++;
          }
        }
        
        if (windowCount >= 2) {
          return 'persistent';
        }
      }
      
      // Default to hesitant if we have some activity but didn't match other patterns
      return eventsLastMinute.length > 0 ? 'hesitant' : 'idle';
    };
    
    // Update status
    setStatus(determineStatus());
    
    // Update inactive time string
    if (lastActivityTime) {
      setInactiveTime(formatInactiveTime(lastActivityTime));
    }
    
    const interval = setInterval(() => {
      setStatus(determineStatus());
      if (lastActivityTime) {
        setInactiveTime(formatInactiveTime(lastActivityTime));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [events, lastActivityTime, helpRequested, formatInactiveTime]);
  
  // Acknowledge help
  const acknowledgeHelp = useCallback(() => {
    setHelpRequested(false);
  }, []);
  
  // Manual interaction handler for testing
  const onInteraction = useCallback((logType: string) => {
    const now = new Date();
    setEvents(prev => [now, ...prev.slice(0, 29)]);
    setLastActivityTime(now);
    
    if (logType === 'HelpRequest') {
      setHelpRequested(true);
    }
    
    setTaskProgress(prev => {
      let increment = 5;
      if (logType === 'PortAdded') {
        increment = 20;
      }
      return Math.min(prev + increment, 100);
    });
  }, []);

  return {
    status,
    lastActivityTime,
    inactiveTime,
    taskProgress,
    helpRequested,
    acknowledgeHelp,
    onInteraction
  };
}
