
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RouterLog } from '@/services/log-service';
import { toast } from '@/hooks/use-toast';

/**
 * Hook to subscribe to real-time updates of router logs
 * @param onNewLog - Callback function that is called when a new log is received
 * @returns The latest log that was received through the real-time subscription
 */
export const useRouterLogsSubscription = (onNewLog: (log: RouterLog) => void) => {
  const [latestLog, setLatestLog] = useState<RouterLog | null>(null);

  useEffect(() => {
    // Create a subscription to the router_logs table
    const channel = supabase
      .channel('router-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'router_logs'
        },
        (payload) => {
          // Extract the new router log from the payload
          const newLog = payload.new as RouterLog;
          
          // Update our local state
          setLatestLog(newLog);
          
          // Call the callback function with the new log
          onNewLog(newLog);

          console.log('Real-time update received:', newLog);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to router logs real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to router logs real-time updates');
          toast({
            variant: 'destructive',
            title: 'Subscription Error',
            description: 'Failed to subscribe to real-time updates'
          });
        }
      });
    
    // Clean up subscription when component unmounts
    return () => {
      console.log('Cleaning up router logs subscription');
      supabase.removeChannel(channel);
    };
  }, [onNewLog]);

  return latestLog;
};
