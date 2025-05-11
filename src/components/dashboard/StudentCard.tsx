
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Student } from "@/services/dashboard-data";
import { MouseEventHandler, memo } from "react";
import ActivityBeacon from "./ActivityBeacon";
import StatusBadge from "./StatusBadge";
import TaskProgressBar from "./TaskProgressBar";
import { useStudentActivity } from "@/hooks/use-student-activity";

interface StudentCardProps {
  student: Student;
  onClick: MouseEventHandler<HTMLDivElement>;
}

const StudentCard = memo(({ student, onClick }: StudentCardProps) => {
  const { name, headset_id, ip_address, avatar, metrics } = student;
  
  const {
    status,
    lastActivityTime,
    inactiveTime,
    taskProgress,
    helpRequested,
    acknowledgeHelp
  } = useStudentActivity(ip_address);

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
      className="cursor-pointer hover:border-vr-purple transition-colors" 
      onClick={handleClick}
    >
      <CardContent className="p-4 flex flex-col gap-3 relative pb-5">
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
          
          {/* Activity Beacon */}
          <ActivityBeacon
            lastInteractionTime={lastActivityTime}
            helpRequested={helpRequested}
            className="absolute top-2 right-2"
          />
        </div>

        {/* Status Badge - centered below avatar row */}
        <StatusBadge 
          status={status} 
          className="self-center mx-auto"
        />
        
        {/* Task Completion Stats - optional, can be hidden on small screens */}
        <div className="text-xs text-muted-foreground text-center sm:block">
          Tasks Completed: {metrics.completed_tasks} ({metrics.task_success_rate}% success)
        </div>
        
        {/* Spacer to push progress bar to bottom */}
        <div className="flex-grow" />
        
        {/* Inactivity Notice */}
        {lastActivityTime && 
         (new Date().getTime() - lastActivityTime.getTime()) / 1000 > 10 && (
          <p className="text-xs text-gray-400 text-center">Inactive since: {inactiveTime}</p>
        )}
        
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
