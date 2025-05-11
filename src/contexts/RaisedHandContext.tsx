
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RaisedHandState {
  raisedHands: Record<string, boolean>;
  helpDots: Record<string, boolean>;
  clearHelpDot: (studentId: string) => void;
}

const RaisedHandContext = createContext<RaisedHandState | undefined>(undefined);

export function RaisedHandProvider({ children }: { children: ReactNode }) {
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({});
  const [helpDots, setHelpDots] = useState<Record<string, boolean>>({});
  const [timeouts, setTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

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

    // Set up Supabase realtime subscription for router_logs
    const channel = supabase
      .channel('router-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'router_logs',
          filter: 'log_type=eq.MenuButton'
        },
        async (payload) => {
          // Extract the content and check if it contains 'Help'
          const content = payload.new.content;
          const buttonName = content?.buttonName;
          
          if (buttonName && typeof buttonName === 'string' && buttonName.includes('Help')) {
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
              return;
            }
            
            if (!studentData) {
              console.log('No student found with IP:', sourceIp);
              return;
            }
            
            // Debounce: Only set raised hand if not already raised
            if (!raisedHands[studentData.id]) {
              // Announce for screen readers
              const announcer = document.getElementById('raised-hand-announcer');
              if (announcer) {
                announcer.textContent = `Student ${studentData.name} is requesting help`;
              }
              
              // Set raised hand state
              setRaisedHands(prev => ({ ...prev, [studentData.id]: true }));
              
              // Clear after 5 seconds and show help dot
              if (timeouts[studentData.id]) {
                clearTimeout(timeouts[studentData.id]);
              }
              
              const timeout = setTimeout(() => {
                setRaisedHands(prev => {
                  const newState = { ...prev };
                  delete newState[studentData.id];
                  return newState;
                });
                
                // Add to help dots
                setHelpDots(prev => {
                  const newDots = { ...prev, [studentData.id]: true };
                  // Persist help dots in local storage
                  localStorage.setItem('helpDots', JSON.stringify(newDots));
                  return newDots;
                });
                
                // Clean up timeout
                setTimeouts(prev => {
                  const newTimeouts = { ...prev };
                  delete newTimeouts[studentData.id];
                  return newTimeouts;
                });
              }, 5000);
              
              setTimeouts(prev => ({ ...prev, [studentData.id]: timeout }));
            }
          }
        }
      )
      .subscribe();
    
    // Clean up on unmount
    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
      supabase.removeChannel(channel);
    };
  }, [raisedHands, timeouts]);
  
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
