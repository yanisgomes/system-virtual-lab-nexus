
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

interface TaskProgressBarProps {
  progress: number;
  onComplete?: () => void;
  className?: string;
}

const TaskProgressBar = ({
  progress,
  onComplete,
  className
}: TaskProgressBarProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [internalProgress, setInternalProgress] = useState(progress);
  const lastProgressRef = useRef(progress);
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // Handle progress updates with animation
  useEffect(() => {
    if (progress >= 100 && !isCompleted) {
      setIsCompleted(true);
      setInternalProgress(100);
      
      // Flash success and reset after delay
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
        setIsCompleted(false);
        setInternalProgress(0);
      }, 2000);
      
      return () => clearTimeout(timer);
    } 
    
    // Only update if progress has increased
    if (progress > lastProgressRef.current) {
      lastProgressRef.current = progress;
      setInternalProgress(progress);
    }
  }, [progress, isCompleted, onComplete]);

  return (
    <div className={cn("w-full h-2 bg-gray-100 rounded-full overflow-hidden", className)}>
      <motion.div
        className={cn(
          "h-full rounded-full transition-colors",
          isCompleted ? "bg-green-500" : "bg-vr-purple"
        )}
        initial={{ width: `${lastProgressRef.current}%` }}
        animate={{ width: `${internalProgress}%` }}
        transition={{
          duration: prefersReducedMotion ? 0.1 : 0.7,
          ease: "easeOut"
        }}
      />
    </div>
  );
};

export default TaskProgressBar;
