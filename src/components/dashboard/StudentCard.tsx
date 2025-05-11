
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
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3 relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{name}</h3>
              <StatusBadge status={status} />
            </div>
            <p className="text-muted-foreground text-xs">{headset_id} ({ip_address})</p>
          </div>
          
          {/* Activity Beacon */}
          <ActivityBeacon
            lastInteractionTime={lastActivityTime}
            helpRequested={helpRequested}
            className="absolute top-0 right-0"
          />
        </div>

        <div className="space-y-3">
          {/* Task Progress Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Task Progress</span>
              <span>{Math.min(taskProgress, 100)}%</span>
            </div>
            <TaskProgressBar 
              progress={taskProgress}
              onComplete={() => console.log(`${name} completed task!`)}
            />
          </div>
          
          {/* Task Completion Stats */}
          <div className="flex justify-between text-xs">
            <span>Tasks Completed</span>
            <span>{metrics.completed_tasks} ({metrics.task_success_rate}% success)</span>
          </div>
          
          {/* Interaction Stats */}
          <div className="flex justify-between text-xs">
            <span>Interactions</span>
            <span>
              {metrics.interactionCounts.blockGrabs + metrics.interactionCounts.menuInteractions} actions
            </span>
          </div>
          
          {/* Inactivity Notice */}
          {lastActivityTime && 
           (new Date().getTime() - lastActivityTime.getTime()) / 1000 > 10 && (
            <p className="text-xs text-gray-400">Inactive since: {inactiveTime}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

StudentCard.displayName = "StudentCard";

export default StudentCard;
