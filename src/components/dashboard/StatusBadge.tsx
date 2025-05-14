
import { Badge } from "@/components/ui/badge";
import { ActivityStatus } from "@/hooks/use-student-activity";
import { LastExerciseEvent } from "./LastExerciseBadge";

interface StatusBadgeProps {
  status: ActivityStatus;
  className?: string;
  lastExerciseEvent?: LastExerciseEvent | null;
}

const StatusBadge = ({ status, className, lastExerciseEvent }: StatusBadgeProps) => {
  // This component is maintained for backward compatibility but 
  // should not be used directly anymore - use LastExerciseBadge instead
  
  // Get appropriate style based on status
  const getBadgeStyle = () => {
    switch (status) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "hesitant":
        return "bg-amber-500 hover:bg-amber-600";
      case "persistent":
        return "bg-blue-500 hover:bg-blue-600";
      case "struggling":
        return "bg-rose-500 hover:bg-rose-600";
      case "idle":
      default:
        return "bg-gray-400 hover:bg-gray-500";
    }
  };
  
  // Get appropriate text based on status
  const getBadgeText = () => {
    switch (status) {
      case "active":
        return "Active";
      case "hesitant":
        return "Hesitant";
      case "persistent":
        return "Persistent";
      case "struggling":
        return "Struggling";
      case "idle":
      default:
        return "Idle";
    }
  };

  return (
    <Badge 
      className={`${getBadgeStyle()} text-xs px-4 py-1 ${className}`}
      aria-label={`Student status: ${getBadgeText()}`}
    >
      {getBadgeText()}
    </Badge>
  );
};

export default StatusBadge;
