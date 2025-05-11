
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Student } from "@/services/dashboard-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityTabContent from "./ActivityTabContent";
import InteractionsTabContent from "./InteractionsTabContent";
import ChatTab from "../chat/ChatTab";

interface StudentDetailModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
}

const StudentDetailModal = ({ student, open, onClose }: StudentDetailModalProps) => {
  if (!student) return null;

  const { name, headset_id, ip_address, metrics, avatar } = student;
  const initials = name.split(" ").map((n) => n[0]).join("");

  // Format timestamp for the chart
  const activityData = metrics.activityHistory.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: item.value
  }));

  // Prepare interaction data for charts
  const handPreferenceData = [
    { name: 'Left Hand', value: metrics.handPreference.leftHandUsage },
    { name: 'Right Hand', value: metrics.handPreference.rightHandUsage }
  ].filter(item => item.value > 0);

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
              Headset: {headset_id} | IP: {ip_address}
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
                  `${metrics.completed_tasks} tasks completed`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="p-1">
            <ActivityTabContent activityData={activityData} />
          </TabsContent>
          
          <TabsContent value="interactions" className="p-1">
            <InteractionsTabContent 
              handPreferenceData={handPreferenceData}
              menuTypeData={menuTypeData}
              blockInteractionData={blockInteractionData}
              totalMenuInteractions={metrics.interactionCounts.menuInteractions}
              totalHandActions={metrics.handPreference.totalHandActions}
            />
          </TabsContent>

          <TabsContent value="chat" className="p-1">
            <ChatTab student={{ id: student.id, name: student.name }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailModal;
