
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export type BeaconStatus = "active" | "idle" | "help";

interface ActivityBeaconProps {
  lastInteractionTime: Date | null;
  helpRequested: boolean;
  onHelpAcknowledged?: () => void;
  className?: string;
}

const ActivityBeacon = ({
  lastInteractionTime,
  helpRequested,
  onHelpAcknowledged,
  className
}: ActivityBeaconProps) => {
  const [status, setStatus] = useState<BeaconStatus>("idle");
  const [ping, setPing] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<number>(0);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  
  // Determine beacon status based on last interaction time
  useEffect(() => {
    if (helpRequested) {
      setStatus("help");
      return;
    }
    
    if (!lastInteractionTime) {
      setStatus("idle");
      return;
    }
    
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastInteractionTime.getTime()) / 1000 / 60;
    
    // If last interaction was within 3 minutes, set to active
    if (diffInMinutes < 3) {
      setStatus("active");
    } else {
      setStatus("idle");
    }
  }, [lastInteractionTime, helpRequested]);
  
  // Trigger ping animation when a new interaction comes in
  useEffect(() => {
    if (!lastInteractionTime) return;
    
    const shouldPing = lastInteractionTime.getTime() > lastPingTime;
    if (shouldPing && status !== "idle") {
      setPing(true);
      setLastPingTime(lastInteractionTime.getTime());
      
      const timer = setTimeout(() => {
        setPing(false);
      }, 2000); // Animation duration
      
      return () => clearTimeout(timer);
    }
  }, [lastInteractionTime, lastPingTime, status]);
  
  const handleHelpClick = useCallback(() => {
    if (status === "help" && onHelpAcknowledged) {
      onHelpAcknowledged();
    }
  }, [status, onHelpAcknowledged]);
  
  // Color based on status
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "help":
        return "bg-rose-500";
      default:
        return "bg-gray-400";
    }
  };

  // Ping color based on status
  const getPingColor = () => {
    switch (status) {
      case "help":
        return "bg-rose-500/30";
      default:
        return "bg-green-500/30";
    }
  };

  return (
    <div 
      className={`relative w-3 h-3 ${className}`}
      onClick={handleHelpClick}
      role="status"
      aria-live="polite"
      aria-label={`Student is ${status}${ping ? ', new interaction detected' : ''}`}
    >
      {/* Static core dot */}
      <div 
        className={`w-3 h-3 rounded-full ${getStatusColor()} ${
          status === "help" ? "animate-pulse-light" : ""
        }`}
      />
      
      {/* Concentric ripple ping animation */}
      <AnimatePresence>
        {ping && !prefersReducedMotion && (
          <>
            {/* First ripple ring (largest, slowest) */}
            <motion.div
              className={`absolute top-1/2 left-1/2 rounded-full ${getPingColor()}`}
              initial={{ width: 0, height: 0, x: "-50%", y: "-50%", opacity: 0.8 }}
              animate={{ 
                width: 32, 
                height: 32,
                x: "-50%", 
                y: "-50%", 
                opacity: 0 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.2,
                ease: "easeOut"
              }}
              aria-hidden="true"
            />
            
            {/* Second ripple ring (medium, medium speed) - staggered keyframe */}
            <motion.div
              className={`absolute top-1/2 left-1/2 rounded-full ${getPingColor()}`}
              initial={{ width: 0, height: 0, x: "-50%", y: "-50%", opacity: 0.6 }}
              animate={{ 
                width: 20, 
                height: 20,
                x: "-50%", 
                y: "-50%", 
                opacity: 0 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1,
                ease: "easeOut",
                delay: 0.1
              }}
              aria-hidden="true"
            />
            
            {/* Third ripple ring (small, fastest) - staggered keyframe */}
            <motion.div
              className={`absolute top-1/2 left-1/2 rounded-full ${getPingColor()}`}
              initial={{ width: 0, height: 0, x: "-50%", y: "-50%", opacity: 0.4 }}
              animate={{ 
                width: 12, 
                height: 12,
                x: "-50%", 
                y: "-50%", 
                opacity: 0 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.8,
                ease: "easeOut",
                delay: 0.2
              }}
              aria-hidden="true"
            />
          </>
        )}
      </AnimatePresence>

      {/* Help indicator */}
      {status === "help" && (
        <div className="absolute -top-1 -right-1">
          <AlertCircle 
            className="text-rose-500 w-3 h-3" 
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

export default ActivityBeacon;
