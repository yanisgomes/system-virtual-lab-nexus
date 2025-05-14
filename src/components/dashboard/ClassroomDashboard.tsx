
import { useEffect, useState } from "react";
import { Student, fetchClassroomData } from "@/services/dashboard-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import EnhancedStudentCard from "./EnhancedStudentCard";
import StudentDetailModal from "./StudentDetailModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { RaisedHandProvider } from "@/contexts/RaisedHandContext";

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
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchClassroomData(classroomId);
        setStudents(data.students);
        setMetrics(data.metrics);
      } catch (error) {
        console.error("Failed to load classroom data", error);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Veuillez vérifier votre connexion et réessayer."
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (classroomId) {
      loadData();
    }
  }, [classroomId, toast]);

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Generate chart data based on students' average attention
  const generateChartData = () => {
    // Use the first student's activity history as a template if available
    if (students.length > 0 && students[0]?.metrics?.activityHistory?.length > 0) {
      return students[0].metrics.activityHistory.map((item, index) => {
        // Calculate the average attention value across all students for this timestamp
        const averageValue = students.reduce((sum, student) => {
          const activityItem = student.metrics.activityHistory[index];
          return sum + (activityItem ? activityItem.value : 0);
        }, 0) / students.length;

        return {
          time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                 new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const chartData = generateChartData();

  return (
    <RaisedHandProvider>
      <div className="flex-1 p-6 overflow-auto bg-[#F8F9FA] font-serif">
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold mb-1">SysVL Nexus - Tableau de bord</h1>
          <p className="text-muted-foreground font-serif">
            Surveillez en temps réel l'activité du laboratoire virtuel et l'engagement des étudiants
          </p>
        </div>

        {/* Student Metrics grid - moved to the top */}
        <div className="mb-8">
          <h2 className="text-xl font-serif font-bold mb-4">Métriques des étudiants</h2>
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

        {/* Classroom Engagement Levels chart - moved below student grid */}
        <div>
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="font-serif">Niveaux d'engagement en classe</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DEFF" />
                    <XAxis dataKey="time" stroke="#7E69AB" />
                    <YAxis domain={[0, 100]} stroke="#7E69AB" />
                    <Tooltip contentStyle={{ fontFamily: "serif" }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Niveau d'attention"
                      stroke="#7E69AB"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, fill: "#7E69AB" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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
