
import React, { useEffect, useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

// Number of seconds to display in the sparkline
const DEFAULT_WINDOW_SIZE = 120; // 2 minutes

// Statuses and their corresponding colors
const ACTIVITY_STATUSES = {
  ACTIVE: { label: "Active", color: "bg-green-500" },
  HESITANT: { label: "Hesitant", color: "bg-yellow-500" },
  PERSISTENT: { label: "Persistent", color: "bg-blue-500" },
  STRUGGLING: { label: "Struggling", color: "bg-rose-500" },
  IDLE: { label: "Idle", color: "bg-gray-500" },
};

interface InteractionSparklineProps {
  sourceIp: string;
  windowSize?: number;
  height?: number;
  className?: string;
}

interface DataPoint {
  timestamp: number;
  count: number;
}

export const InteractionSparkline = memo(({
  sourceIp,
  windowSize = DEFAULT_WINDOW_SIZE,
  height = 36,
  className = "",
}: InteractionSparklineProps) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [status, setStatus] = useState<keyof typeof ACTIVITY_STATUSES>("IDLE");

  // Initialize data points array with empty values for the entire window
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    const initialData: DataPoint[] = [];
    
    for (let i = windowSize - 1; i >= 0; i--) {
      initialData.push({
        timestamp: now - i,
        count: 0,
      });
    }
    
    setDataPoints(initialData);
  }, [windowSize]);

  // Calculate activity status based on recent interaction patterns
  const calculateStatus = useCallback((points: DataPoint[]) => {
    const activeThreshold = 10; // seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Check if inactive for too long
    if (!lastActivity || (now - Math.floor(lastActivity.getTime() / 1000)) > activeThreshold) {
      return "IDLE";
    }
    
    // Count events in recent periods
    const lastMinute = points.slice(-60);
    const totalEvents = lastMinute.reduce((sum, point) => sum + point.count, 0);
    const eventsWithActivity = lastMinute.filter(p => p.count > 0).length;
    const consistency = eventsWithActivity / Math.max(1, totalEvents);
    
    if (totalEvents > 20) return "ACTIVE";
    if (totalEvents > 10 && consistency < 0.4) return "HESITANT";
    if (totalEvents > 5 && consistency > 0.7) return "PERSISTENT";
    return "STRUGGLING";
  }, [lastActivity]);
  
  // Subscribe to Supabase realtime updates for router_logs
  useEffect(() => {
    let channel: RealtimeChannel;
    
    const setupSubscription = async () => {
      // Set up realtime subscription for the specific source IP
      channel = supabase
        .channel(`sparkline-${sourceIp}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'router_logs',
            filter: `source_ip=eq.${sourceIp}`,
          },
          (payload) => {
            const now = new Date();
            setLastActivity(now);
            
            // Update data points with the new log entry
            setDataPoints(prevPoints => {
              const currentTime = Math.floor(now.getTime() / 1000);
              
              // Create a new array with shifted points
              const newPoints = [...prevPoints.slice(1)];
              
              // Add or increment the latest point
              const lastPoint = newPoints[newPoints.length - 1];
              
              if (lastPoint && lastPoint.timestamp === currentTime) {
                // Increment the existing point for this second
                lastPoint.count += 1;
              } else {
                // Add a new point for this second
                newPoints.push({
                  timestamp: currentTime,
                  count: 1,
                });
              }
              
              return newPoints;
            });
          }
        )
        .subscribe();
    };
    
    setupSubscription();
    
    // Clean up subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [sourceIp]);
  
  // Periodically shift the window and update status
  useEffect(() => {
    // Update sparkline every second
    const intervalId = setInterval(() => {
      setDataPoints(prevPoints => {
        // Shift points left by removing oldest and adding a new empty one
        const now = Math.floor(Date.now() / 1000);
        const newPoints = [...prevPoints.slice(1), { timestamp: now, count: 0 }];
        return newPoints;
      });
    }, 1000);
    
    // Update status every 5 seconds
    const statusIntervalId = setInterval(() => {
      setStatus(calculateStatus(dataPoints));
    }, 5000);
    
    // Initial status calculation
    setStatus(calculateStatus(dataPoints));
    
    return () => {
      clearInterval(intervalId);
      clearInterval(statusIntervalId);
    };
  }, [dataPoints, calculateStatus]);
  
  // Calculate time since last activity
  const getInactivityTime = () => {
    if (!lastActivity) return "No activity yet";
    
    const seconds = Math.floor((Date.now() - lastActivity.getTime()) / 1000);
    
    if (seconds < 60) return `Inactive since ${seconds}s`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `Inactive since ${minutes}m ${seconds % 60}s`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `Inactive since ${hours}h ${minutes}m`;
  };
  
  // Find the maximum count for scaling
  const maxCount = Math.max(1, ...dataPoints.map(p => p.count));
  
  // Check if inactive for more than 10 seconds
  const isInactive = !lastActivity || 
    (Math.floor(Date.now() / 1000) - Math.floor(lastActivity.getTime() / 1000)) >= 10;
  
  const currentStatus = ACTIVITY_STATUSES[status];
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span>Real-time Activity</span>
        <Badge 
          variant="outline"
          className={`${currentStatus.color} text-white`}
        >
          {currentStatus.label}
        </Badge>
      </div>
      
      <AnimatePresence mode="wait">
        {isInactive ? (
          <motion.div
            key="inactive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-10 bg-gray-50 rounded text-muted-foreground text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            {getInactivityTime()}
          </motion.div>
        ) : (
          <motion.div 
            key="sparkline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-10"
          >
            <div className="absolute inset-0 bg-gray-50 rounded" />
            
            <svg
              width="100%"
              height={height}
              className="relative z-10"
              style={{ overflow: "visible" }}
            >
              {/* Baseline */}
              <line
                x1="0"
                y1={height - 4}
                x2="100%"
                y2={height - 4}
                stroke="#F1F0FB"
                strokeWidth="2"
              />
              
              {/* Data points */}
              {dataPoints.map((point, i) => {
                const x = (i / windowSize) * 100 + "%";
                const barHeight = Math.max(0, (point.count / maxCount) * (height - 8));
                const y = height - barHeight - 4;
                
                return (
                  <motion.rect
                    key={`${point.timestamp}-${i}`}
                    initial={{ height: 0, y: height - 4 }}
                    animate={{ height: barHeight, y }}
                    transition={{ duration: 0.2 }}
                    x={x}
                    y={y}
                    width={100 / windowSize + "%"}
                    height={barHeight}
                    fill="#9b87f5"
                    opacity={0.8}
                    rx={1}
                    className="drop-shadow-sm"
                  />
                );
              })}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

InteractionSparkline.displayName = "InteractionSparkline";

export default InteractionSparkline;
