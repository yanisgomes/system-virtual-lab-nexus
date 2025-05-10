
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Student } from "@/services/dashboard-data";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StudentDetailModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
}

const StudentDetailModal = ({ student, open, onClose }: StudentDetailModalProps) => {
  if (!student) return null;

  const { name, headsetId, metrics, avatar } = student;
  const initials = name.split(" ").map((n) => n[0]).join("");

  // Format timestamp for the chart
  const activityData = metrics.activityHistory.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: item.value
  }));

  const getProgressColor = (value: number) => {
    if (value >= 70) return "bg-green-500";
    if (value >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-xl">{name}</DialogTitle>
            <DialogDescription>Headset ID: {headsetId}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.attention}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.engagement}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.taskSuccessRate}%</div>
              <p className="text-xs text-muted-foreground">{metrics.completedTasks} tasks completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="focus">Focus Areas</TabsTrigger>
            <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="p-1">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="Engagement Level"
                        stroke="#9b87f5" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6, fill: "#7E69AB" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="focus" className="p-1">
            <Card>
              <CardHeader>
                <CardTitle>Focus Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.focusAreas.map((area) => (
                    <div key={area.area} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">{area.area}</span>
                        <span className="text-sm font-medium">{area.percentage}%</span>
                      </div>
                      <Progress 
                        value={area.percentage} 
                        className="h-2"
                        indicatorClassName={getProgressColor(area.percentage)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metrics" className="p-1">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Interaction Rate</h4>
                  <div className="flex items-center">
                    <Progress 
                      value={metrics.interactionRate} 
                      className="h-2 flex-1 mr-2"
                      indicatorClassName={getProgressColor(metrics.interactionRate)}
                    />
                    <span className="text-sm font-medium w-10 text-right">{metrics.interactionRate}%</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Movement Distance</h4>
                  <p className="text-lg font-bold">{metrics.moveDistance} <span className="text-sm font-normal text-muted-foreground">meters</span></p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Task Success Rate</h4>
                  <div className="flex items-center">
                    <Progress 
                      value={metrics.taskSuccessRate} 
                      className="h-2 flex-1 mr-2"
                      indicatorClassName={getProgressColor(metrics.taskSuccessRate)}
                    />
                    <span className="text-sm font-medium w-10 text-right">{metrics.taskSuccessRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailModal;
