
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Student } from "@/services/dashboard-data";
import { MouseEventHandler } from "react";

interface StudentCardProps {
  student: Student;
  onClick: MouseEventHandler<HTMLDivElement>;
}

const StudentCard = ({ student, onClick }: StudentCardProps) => {
  const { name, metrics, headsetId, avatar } = student;

  const getProgressColor = (value: number) => {
    if (value >= 70) return "bg-green-500";
    if (value >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

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
            <p className="text-muted-foreground text-xs">{headsetId}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Attention</span>
              <span className="font-medium">{metrics.attention}%</span>
            </div>
            <Progress 
              value={metrics.attention} 
              className="h-2"
              indicatorClassName={getProgressColor(metrics.attention)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Engagement</span>
              <span className="font-medium">{metrics.engagement}%</span>
            </div>
            <Progress 
              value={metrics.engagement} 
              className="h-2"
              indicatorClassName={getProgressColor(metrics.engagement)}
            />
          </div>

          <div className="flex justify-between text-xs">
            <span>Tasks Completed</span>
            <span>{metrics.completedTasks} ({metrics.taskSuccessRate}% success)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
