
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Define a type for the Postgres Insert payload we'll receive from Supabase
interface PostgresInsertPayload {
  new: {
    id: string;
    timestamp: string;
    source_ip: string;
    log_type: string;
    content: {
      buttonName?: string;
      [key: string]: any;
    };
    time_seconds: number;
    raw_log?: string;
  };
}

interface RaisedHandState {
  raisedHands: Record<string, boolean>;
  helpDots: Record<string, boolean>;
  clearHelpDot: (studentId: string) => void;
}

const RaisedHandContext = createContext<RaisedHandState | undefined>(undefined);

export function RaisedHandProvider({ children }: { children: ReactNode }) {
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({});
  const [helpDots, setHelpDots] = useState<Record<string, boolean>>({});
  
  // Use a ref to store timeouts so we don't re-subscribe on every state change
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    // Load persisted help dots from local storage on initial mount
    const storedHelpDots = localStorage.getItem('helpDots');
    if (storedHelpDots) {
      try {
        const parsedDots = JSON.parse(storedHelpDots);
        setHelpDots(parsedDots);
      } catch (e) {
        console.error('Failed to parse stored help dots:', e);
      }
    }

    // Handler function for processing new router log entries
    const handleLogInsert = async (payload: PostgresInsertPayload) => {
      console.log("Router log insert detected:", payload);
      
      // Extract the content and check if it contains 'Help'
      const content = payload.new.content;
      const buttonName = content?.buttonName;
      
      if (buttonName && typeof buttonName === 'string' && buttonName.includes('Help')) {
        console.log("Help button press detected:", buttonName);
        
        // Get the source IP
        const sourceIp = payload.new.source_ip;
        
        // Query for the student with this IP
        const { data: studentData, error } = await supabase
          .from('students')
          .select('id, name')
          .eq('ip_address', sourceIp)
          .single();
        
        if (error) {
          console.error('Error finding student:', error);
          toast.error(`Failed to identify student with IP: ${sourceIp}`);
          return;
        }
        
        if (!studentData) {
          console.log('No student found with IP:', sourceIp);
          toast.warning(`No registered student found with IP: ${sourceIp}`);
          return;
        }
        
        console.log(`Student ${studentData.name} raised hand`);
        
        // Debounce: Only set raised hand if not already raised
        setRaisedHands(prev => {
          // If already raised, don't update
          if (prev[studentData.id]) return prev;
          
          // Announce for screen readers
          const announcer = document.getElementById('raised-hand-announcer');
          if (announcer) {
            announcer.textContent = `Student ${studentData.name} is requesting help`;
          }
          
          // Clear after 5 seconds and show help dot
          if (timeoutsRef.current[studentData.id]) {
            clearTimeout(timeoutsRef.current[studentData.id]);
          }
          
          timeoutsRef.current[studentData.id] = setTimeout(() => {
            setRaisedHands(prevHands => {
              const newState = { ...prevHands };
              delete newState[studentData.id];
              return newState;
            });
            
            // Add to help dots
            setHelpDots(prevDots => {
              const newDots = { ...prevDots, [studentData.id]: true };
              // Persist help dots in local storage
              localStorage.setItem('helpDots', JSON.stringify(newDots));
              return newDots;
            });
            
            // Clean up timeout reference
            delete timeoutsRef.current[studentData.id];
          }, 5000);
          
          // Return the new state with raised hand
          return { ...prev, [studentData.id]: true };
        });
      }
    };

    // Set up Supabase realtime subscription for router_logs - ONE TIME ONLY
    const channel = supabase
      .channel('router-logs-hand')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'router_logs',
          // Accept both possible values for log_type
          filter: 'log_type=in.(MenuButton,MenuButtonPress)'
        },
        handleLogInsert
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("Successfully subscribed to router_logs changes");
        } else if (status === 'CHANNEL_ERROR') {
          console.error("Error subscribing to router_logs changes");
          toast.error("Failed to connect to realtime updates");
        }
      });
    
    // Clean up on unmount - clear ALL timeouts and channel
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - we attach ONCE
  
  const clearHelpDot = (studentId: string) => {
    setHelpDots(prev => {
      const newDots = { ...prev };
      delete newDots[studentId];
      // Update persisted help dots
      localStorage.setItem('helpDots', JSON.stringify(newDots));
      return newDots;
    });
  };
  
  return (
    <RaisedHandContext.Provider value={{ raisedHands, helpDots, clearHelpDot }}>
      {/* Screen reader announcement element */}
      <div 
        id="raised-hand-announcer" 
        aria-live="polite" 
        className="sr-only"
      ></div>
      {children}
    </RaisedHandContext.Provider>
  );
}

export const useRaisedHand = () => {
  const context = useContext(RaisedHandContext);
  if (context === undefined) {
    throw new Error('useRaisedHand must be used within a RaisedHandProvider');
  }
  return context;
};
