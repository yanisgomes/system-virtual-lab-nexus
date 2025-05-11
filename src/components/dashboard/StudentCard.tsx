
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Student } from "@/services/dashboard-data";
import { MouseEventHandler } from "react";
import InteractionSparkline from "./InteractionSparkline";

interface StudentCardProps {
  student: Student;
  onClick: MouseEventHandler<HTMLDivElement>;
}

const StudentCard = ({ student, onClick }: StudentCardProps) => {
  const { name, metrics, headset_id, ip_address, avatar } = student;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Card 
      className="cursor-pointer hover:border-vr-purple transition-colors" 
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-sm">{name}</h3>
            <p className="text-muted-foreground text-xs">{headset_id} ({ip_address})</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Replace static progress bars with real-time sparkline */}
          <InteractionSparkline 
            sourceIp={ip_address} 
            className="mt-1" 
            windowSize={120} // 2 minutes window
          />

          <div className="flex justify-between text-xs">
            <span>Tasks Completed</span>
            <span>{metrics.completed_tasks} ({metrics.task_success_rate}% success)</span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Interactions</span>
            <span>
              {metrics.interactionCounts.blockGrabs + metrics.interactionCounts.menuInteractions} actions
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
