
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy } from "lucide-react";
import { Message } from "@/services/message-service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LastExerciseBadgeProps {
  lastExerciseMessage: Message | null;
  className?: string;
}

const LastExerciseBadge = ({ lastExerciseMessage, className = "" }: LastExerciseBadgeProps) => {
  // If no last exercise, return nothing
  if (!lastExerciseMessage || !lastExerciseMessage.metadata) {
    return null;
  }

  const isLoaded = lastExerciseMessage.type === "exercise_loaded";
  const metadata = lastExerciseMessage.metadata;
  
  // We need to check what type of metadata we have
  const exerciseData = metadata as any;

  // Determine badge color based on type
  const badgeVariant = isLoaded ? "outline" : "default";
  
  // Create badge content
  let badgeContent = (
    <div className="flex items-center gap-1 text-xs">
      {isLoaded ? (
        <BookOpen className="h-3 w-3 mr-1" />
      ) : (
        <Trophy className="h-3 w-3 mr-1" />
      )}
      <span>{isLoaded ? "Chargé" : "Terminé"}</span>
      
      {!isLoaded && exerciseData.correctLinks !== undefined && exerciseData.requiredLinks !== undefined && (
        <span className="ml-1">
          ({exerciseData.correctLinks}/{exerciseData.requiredLinks})
        </span>
      )}
    </div>
  );
  
  // Create tooltip content with more details
  const tooltipContent = (
    <div className="space-y-1 max-w-xs">
      <p className="font-medium">{exerciseData.systemName}</p>
      <p className="text-xs">{exerciseData.systemDesc}</p>
      <p className="text-xs">Difficulté: {exerciseData.systemDiff}</p>
    </div>
  );
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={badgeVariant} className={`${className} cursor-help`}>
            {badgeContent}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LastExerciseBadge;
