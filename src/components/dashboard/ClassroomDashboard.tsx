
import { useEffect, useState, useCallback } from "react";
import { Student, ClassroomMetrics, fetchClassroomData } from "@/services/dashboard-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "./MetricCard";
import EnhancedStudentCard from "./EnhancedStudentCard";
import StudentDetailModal from "./StudentDetailModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RaisedHandProvider } from "@/contexts/RaisedHandContext";
import { useRouterLogsSubscription } from "@/hooks/use-router-logs-subscription";
import { RouterLog } from "@/services/log-service";
import { 
  processActivityHistory, 
  processFocusAreas, 
  processBlockInteractions, 
  processHandUsage, 
  processMenuInteractions 
} from "@/services/dashboard-data";

interface ClassroomDashboardProps {
  classroomId: string;
}

const ClassroomDashboard = ({ classroomId }: ClassroomDashboardProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [metrics, setMetrics] = useState<{
    totalEngagement: number;
    averageAttention: number;
    activeStudents: number;
    sessionDuration: number;
  }>({
    totalEngagement: 0,
    averageAttention: 0,
    activeStudents: 0,
    sessionDuration: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [focusAreas, setFocusAreas] = useState<any[]>([]);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchClassroomData(classroomId);
        setStudents(data.students);
        setMetrics(data.metrics);
        
        // Generate initial chart and focus area data
        const initialChartData = generateChartData(data.students);
        setChartData(initialChartData);
        
        const initialFocusAreas = generateAggregatedFocusAreas(data.students);
        setFocusAreas(initialFocusAreas);
      } catch (error) {
        console.error("Failed to load classroom data", error);
        toast({
          variant: "destructive",
          title: "Error loading classroom data",
          description: "Please check your connection and try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (classroomId) {
      loadData();
    }
  }, [classroomId, toast]);

  // Handler for new router logs
  const handleNewLog = useCallback((log: RouterLog) => {
    // Find the student that matches this log's source_ip
    setStudents(prevStudents => {
      const studentIndex = prevStudents.findIndex(
        student => student.ip_address === log.source_ip
      );
      
      if (studentIndex === -1) {
        // No matching student found
        return prevStudents;
      }
      
      // Clone the students array
      const updatedStudents = [...prevStudents];
      const student = { ...updatedStudents[studentIndex] };
      
      // Process the new log to update student metrics
      const updatedMetrics = { ...student.metrics };

      // Update activity history
      const newActivityHistory = processActivityHistory([log, ...student.metrics.activityHistory.map(item => ({
        timestamp: item.timestamp,
        content: { value: item.value } as any,
        log_type: 'ActivityData',
        source_ip: student.ip_address,
        id: `activity-${item.timestamp}`,
        time_seconds: 0
      }))]);
      
      updatedMetrics.activityHistory = newActivityHistory;
      
      // Update focus areas
      updatedMetrics.focusAreas = processFocusAreas([log, ...student.metrics.focusAreas.map(area => ({
        timestamp: new Date().toISOString(),
        content: { area: area.area, percentage: area.percentage } as any,
        log_type: 'FocusArea',
        source_ip: student.ip_address,
        id: `focus-${area.area}`,
        time_seconds: 0
      }))]);
      
      // Update interaction counts
      if (log.log_type === 'BlockAction' || log.log_type === 'MenuButton') {
        const blockCounts = processBlockInteractions([log]);
        const menuCounts = processMenuInteractions([log]);
        
        updatedMetrics.interactionCounts = {
          blockGrabs: updatedMetrics.interactionCounts.blockGrabs + blockCounts.blockGrabs,
          blockReleases: updatedMetrics.interactionCounts.blockReleases + blockCounts.blockReleases,
          menuInteractions: updatedMetrics.interactionCounts.menuInteractions + menuCounts.menuInteractions,
          menuTypes: { ...updatedMetrics.interactionCounts.menuTypes, ...menuCounts.menuTypes }
        };
      }
      
      // Update hand preference
      const handCounts = processHandUsage([log]);
      if (handCounts.leftHandUsage > 0 || handCounts.rightHandUsage > 0) {
        updatedMetrics.handPreference = {
          leftHandUsage: updatedMetrics.handPreference.leftHandUsage + handCounts.leftHandUsage,
          rightHandUsage: updatedMetrics.handPreference.rightHandUsage + handCounts.rightHandUsage,
          totalHandActions: updatedMetrics.handPreference.totalHandActions + handCounts.totalHandActions
        };
      }
      
      // Update attention and engagement based on activity
      // Simple heuristic: interaction increases attention by a small amount
      if (log.log_type === 'BlockAction' || log.log_type === 'MenuButton' || log.log_type === 'Movement') {
        updatedMetrics.attention = Math.min(100, updatedMetrics.attention + 2);
        updatedMetrics.engagement = Math.min(100, updatedMetrics.engagement + 1);
      }
      
      // Apply the updated metrics to the student
      student.metrics = updatedMetrics;
      updatedStudents[studentIndex] = student;
      
      // Update chart and focus area data with the new student information
      setChartData(generateChartData(updatedStudents));
      setFocusAreas(generateAggregatedFocusAreas(updatedStudents));
      
      // Update overall metrics
      updateOverallMetrics(updatedStudents);
      
      return updatedStudents;
    });
  }, []);
  
  // Use the router logs subscription hook
  useRouterLogsSubscription(handleNewLog);

  // Calculate overall metrics based on student data
  const updateOverallMetrics = (updatedStudents: Student[]) => {
    // Calculate average attention and engagement
    const totalStudents = updatedStudents.length;
    
    if (totalStudents === 0) return;
    
    const totalAttention = updatedStudents.reduce((sum, student) => sum + student.metrics.attention, 0);
    const totalEngagement = updatedStudents.reduce((sum, student) => sum + student.metrics.engagement, 0);
    
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      averageAttention: Math.round(totalAttention / totalStudents),
      totalEngagement: Math.round(totalEngagement / totalStudents),
      activeStudents: updatedStudents.filter(s => s.metrics.attention > 30).length
    }));
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Generate chart data based on students' average attention
  const generateChartData = (studentList: Student[]) => {
    // Use the first student's activity history as a template if available
    if (studentList.length > 0 && studentList[0]?.metrics?.activityHistory?.length > 0) {
      return studentList[0].metrics.activityHistory.map((item, index) => {
        // Calculate the average attention value across all students for this timestamp
        const averageValue = studentList.reduce((sum, student) => {
          const activityItem = student.metrics.activityHistory[index];
          return sum + (activityItem ? activityItem.value : 0);
        }, 0) / studentList.length;

        return {
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.round(averageValue),
        };
      });
    }
    
    // Fallback to generic data if no students or activity history
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (11 - i) * 5);
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: Math.floor(Math.random() * 30) + (metrics.averageAttention - 15),
      };
    });
  };

  // Aggregate focus areas across all students
  const generateAggregatedFocusAreas = (studentList: Student[]) => {
    const focusAreaMap: Record<string, number[]> = {};
    
    studentList.forEach(student => {
      student.metrics.focusAreas.forEach(area => {
        if (!focusAreaMap[area.area]) {
          focusAreaMap[area.area] = [];
        }
        focusAreaMap[area.area].push(area.percentage);
      });
    });
    
    return Object.entries(focusAreaMap)
      .map(([area, percentages]) => ({
        area,
        percentage: Math.round(percentages.reduce((sum, val) => sum + val, 0) / percentages.length)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4); // Take top 4 focus areas
  };

  return (
    <RaisedHandProvider>
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Classroom Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor real-time VR activity and student engagement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Engagement"
            value={`${metrics.totalEngagement}%`}
            trend={2}
            isLoading={isLoading}
          />
          <MetricCard
            title="Average Attention"
            value={`${metrics.averageAttention}%`}
            trend={-1}
            isLoading={isLoading}
          />
          <MetricCard
            title="Active Students"
            value={metrics.activeStudents}
            description={`${metrics.activeStudents} students connected`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Session Duration"
            value={`${metrics.sessionDuration} min`}
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Classroom Attention Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Attention Level"
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

          <Card>
            <CardHeader>
              <CardTitle>Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="h-2 bg-muted rounded-full animate-pulse"></div>
                  </div>
                ))
              ) : (
                focusAreas.map((focusArea, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span>{focusArea.area}</span>
                      <span className="font-medium">{focusArea.percentage}%</span>
                    </div>
                    <div className="h-2 bg-vr-light-gray rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          index === 0 ? "bg-vr-purple" :
                          index === 1 ? "bg-vr-dark-purple" :
                          index === 2 ? "bg-vr-blue" :
                          "bg-yellow-500"
                        }`}
                        style={{ width: `${focusArea.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Student Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-muted h-10 w-10"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 bg-muted rounded w-full"></div>
                      <div className="h-2 bg-muted rounded w-full"></div>
                      <div className="h-2 bg-muted rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              students.map((student) => (
                <EnhancedStudentCard
                  key={student.id}
                  student={student}
                  onClick={() => handleStudentClick(student)}
                />
              ))
            )}
          </div>
        </div>

        <StudentDetailModal
          student={selectedStudent}
          open={isModalOpen}
          onClose={closeModal}
        />
      </div>
    </RaisedHandProvider>
  );
};

export default ClassroomDashboard;
