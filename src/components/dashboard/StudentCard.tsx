
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Student } from "@/services/dashboard-data";
import { MouseEventHandler, memo, useEffect } from "react";
import ActivityBeacon from "./ActivityBeacon";
import TaskProgressBar from "./TaskProgressBar";
import { useStudentActivity } from "@/hooks/use-student-activity";
import LastExerciseBadge from "./LastExerciseBadge";
import { useChatMessages } from "@/hooks/useChatMessages";

interface StudentCardProps {
  student: Student;
  onClick: MouseEventHandler<HTMLDivElement>;
}

const StudentCard = memo(({ student, onClick }: StudentCardProps) => {
  const { name, headset_id, ip_address, avatar } = student;
  
  const {
    lastActivityTime,
    taskProgress,
    helpRequested,
    acknowledgeHelp
  } = useStudentActivity(ip_address);
  
  // Get student messages to extract latest exercise
  const { messages, isLoading } = useChatMessages(student.id);
  
  // Find the latest exercise message
  const latestExerciseMessage = isLoading ? null : 
    messages.find(msg => msg.type === "exercise_loaded" || msg.type === "exercise_finished") || null;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
    onClick(e);
    if (helpRequested) {
      acknowledgeHelp();
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:border-vr-purple transition-colors h-full" 
      onClick={handleClick}
    >
      <CardContent className="p-4 flex flex-col gap-3 min-h-[196px] relative pb-5">
        {/* Header row with avatar and student info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-sm">{name}</h3>
            <p className="text-muted-foreground text-xs">{headset_id} ({ip_address})</p>
          </div>
          
          {/* Activity Beacon - the single visual indicator */}
          <ActivityBeacon
            lastInteractionTime={lastActivityTime}
            helpRequested={helpRequested}
            className="absolute top-2 right-2"
          />
        </div>

        {/* Last Exercise Badge - replaces the status badge */}
        <LastExerciseBadge 
          lastExerciseMessage={latestExerciseMessage}
          className="self-center mx-auto"
        />
        
        {/* Spacer to push progress bar to bottom */}
        <div className="flex-grow" />
        
        {/* Task Progress Bar at bottom */}
        <div className="mt-auto">
          <div className="flex justify-between text-xs mb-1">
            <span>Task Progress</span>
            <span>{Math.min(taskProgress, 100)}%</span>
          </div>
          <TaskProgressBar 
            progress={taskProgress}
            onComplete={() => console.log(`${name} completed task!`)}
          />
        </div>
      </CardContent>
    </Card>
  );
});

StudentCard.displayName = "StudentCard";

export default StudentCard;
