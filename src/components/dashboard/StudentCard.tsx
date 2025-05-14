
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Student } from "@/services/dashboard-data";
import { MouseEventHandler, memo, useEffect, useState } from "react";
import ActivityBeacon from "./ActivityBeacon";
import LastExerciseBadge, { LastExerciseEvent } from "./LastExerciseBadge";
import TaskProgressBar from "./TaskProgressBar";
import { useStudentActivity } from "@/hooks/use-student-activity";
import { Message } from "@/services/message-service";
import { useQuery } from "@tanstack/react-query";
import { fetchMessages } from "@/services/message-service";

interface StudentCardProps {
  student: Student;
  onClick: MouseEventHandler<HTMLDivElement>;
}

const StudentCard = memo(({ student, onClick }: StudentCardProps) => {
  const { name, headset_id, ip_address, avatar } = student;
  const [lastExerciseEvent, setLastExerciseEvent] = useState<LastExerciseEvent | null>(null);
  
  const {
    status,
    lastActivityTime,
    inactiveTime,
    taskProgress,
    helpRequested,
    acknowledgeHelp
  } = useStudentActivity(ip_address);

  // Fetch the student's messages to find the latest exercise event
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", student.id],
    queryFn: () => fetchMessages(student.id),
    refetchOnWindowFocus: false,
  });
  
  // Extract the last exercise event from messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Find the most recent exercise-related message
      const exerciseMessages = messages.filter(
        (msg) => msg.type === "exercise_loaded" || msg.type === "exercise_finished"
      );
      
      if (exerciseMessages.length > 0) {
        const latestMessage = exerciseMessages[0]; // Messages are already sorted by created_at in descending order
        
        setLastExerciseEvent({
          type: latestMessage.type as "exercise_loaded" | "exercise_finished",
          data: latestMessage.metadata
        });
      }
    }
  }, [messages]);

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

        {/* Last Exercise Badge - replaced status badge */}
        <LastExerciseBadge 
          event={lastExerciseEvent}
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
