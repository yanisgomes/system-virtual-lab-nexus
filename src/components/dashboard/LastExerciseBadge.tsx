
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy } from "lucide-react";
import { SystemExerciseData, SystemFinishedData } from "@/services/message-service";

export type LastExerciseEvent = {
  type: "exercise_loaded" | "exercise_finished";
  data: SystemExerciseData | SystemFinishedData;
};

interface LastExerciseBadgeProps {
  event: LastExerciseEvent | null;
  className?: string;
}

const LastExerciseBadge = ({ event, className = "" }: LastExerciseBadgeProps) => {
  if (!event) return null;

  const isLoaded = event.type === "exercise_loaded";
  const data = event.data;
  
  // Get badge style based on difficulty
  const getBadgeStyle = () => {
    switch (data.systemDiff) {
      case "1":
        return "bg-green-500 hover:bg-green-600";
      case "2":
        return "bg-amber-500 hover:bg-amber-600";
      case "3":
        return "bg-rose-500 hover:bg-rose-600";
      default:
        return "bg-purple-500 hover:bg-purple-600";
    }
  };
  
  // Construct the badge text
  const getBadgeText = () => {
    const eventType = isLoaded ? "Chargé" : "Terminé";
    const title = data.systemName;
    
    // For finished exercises, add the score
    if (!isLoaded) {
      const finishedData = data as SystemFinishedData;
      const requiredLinks = event.type === "exercise_loaded" 
        ? (data as SystemExerciseData).requiredLinks
        : finishedData.correctLinks + finishedData.incorrectLinks;
      
      return `${eventType}: ${title} (${finishedData.correctLinks}/${requiredLinks})`;
    }
    
    return `${eventType}: ${title}`;
  };

  return (
    <Badge 
      className={`${getBadgeStyle()} text-xs px-3 py-1 flex items-center gap-1 ${className}`}
      aria-label={`Statut exercice: ${getBadgeText()}`}
    >
      {isLoaded ? (
        <BookOpen className="h-3 w-3" />
      ) : (
        <Trophy className="h-3 w-3" />
      )}
      <span className="ml-1">{getBadgeText()}</span>
    </Badge>
  );
};

export default LastExerciseBadge;
