
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Student } from "@/services/dashboard-data";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface StudentDetailModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
}

const StudentDetailModal = ({ student, open, onClose }: StudentDetailModalProps) => {
  if (!student) return null;

  const { name, headsetId, ipAddress, metrics, avatar } = student;
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

  // Prepare interaction data for charts
  const handPreferenceData = [
    { name: 'Left Hand', value: metrics.handPreference.leftHandUsage },
    { name: 'Right Hand', value: metrics.handPreference.rightHandUsage }
  ].filter(item => item.value > 0);

  const COLORS = ['#9b87f5', '#7E69AB', '#f59b87', '#87f59b'];

  // Prepare menu interaction data
  const menuTypeData = Object.entries(metrics.interactionCounts.menuTypes).map(([key, value]) => ({
    name: key.replace('Btn', ''),
    value
  }));

  // Prepare block interaction data
  const blockInteractionData = [
    { name: 'Grabs', value: metrics.interactionCounts.blockGrabs },
    { name: 'Releases', value: metrics.interactionCounts.blockReleases }
  ];

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
            <DialogDescription>
              Headset: {headsetId} | IP: {ipAddress}
            </DialogDescription>
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
              <CardTitle className="text-sm text-muted-foreground">Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.interactionCounts.blockGrabs + metrics.interactionCounts.menuInteractions}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.interactionCounts.blockGrabs > 0 && `${metrics.interactionCounts.blockGrabs} blocks, `}
                {metrics.interactionCounts.menuInteractions > 0 && `${metrics.interactionCounts.menuInteractions} menu actions`}
                {metrics.interactionCounts.blockGrabs === 0 && metrics.interactionCounts.menuInteractions === 0 && 
                  `${metrics.completedTasks} tasks completed`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="focus">Focus Areas</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
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
          
          <TabsContent value="interactions" className="p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {handPreferenceData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Hand Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={handPreferenceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {handPreferenceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2 text-sm">
                      Total: {metrics.handPreference.totalHandActions} hand interactions
                    </div>
                  </CardContent>
                </Card>
              )}

              {menuTypeData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Menu Interactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={menuTypeData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#9b87f5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2 text-sm">
                      Total: {metrics.interactionCounts.menuInteractions} menu interactions
                    </div>
                  </CardContent>
                </Card>
              )}

              {blockInteractionData[0].value > 0 && (
                <Card className={menuTypeData.length === 0 ? "md:col-span-2" : ""}>
                  <CardHeader>
                    <CardTitle>Block Interactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={blockInteractionData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#7E69AB" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
