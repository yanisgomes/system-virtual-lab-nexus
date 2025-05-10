
import { useEffect, useState } from "react";
import { Student, ClassroomMetrics, fetchClassroomData } from "@/services/dashboard-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "./MetricCard";
import StudentCard from "./StudentCard";
import StudentDetailModal from "./StudentDetailModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClassroomDashboardProps {
  classroomId: string;
}

const ClassroomDashboard = ({ classroomId }: ClassroomDashboardProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [metrics, setMetrics] = useState<ClassroomMetrics>({
    totalEngagement: 0,
    averageAttention: 0,
    activeStudents: 0,
    sessionDuration: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchClassroomData(classroomId);
        setStudents(data.students);
        setMetrics(data.metrics);
      } catch (error) {
        console.error("Failed to load classroom data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [classroomId]);

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Generate mock chart data
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (11 - i) * 5);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: Math.floor(Math.random() * 30) + (metrics.averageAttention - 15),
    };
  });

  return (
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
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Visual Content</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="h-2 bg-vr-light-gray rounded-full overflow-hidden">
                <div className="h-full bg-vr-purple rounded-full" style={{ width: "78%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Interactive Elements</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="h-2 bg-vr-light-gray rounded-full overflow-hidden">
                <div className="h-full bg-vr-dark-purple rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>3D Models</span>
                <span className="font-medium">82%</span>
              </div>
              <div className="h-2 bg-vr-light-gray rounded-full overflow-hidden">
                <div className="h-full bg-vr-blue rounded-full" style={{ width: "82%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Audio Content</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="h-2 bg-vr-light-gray rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: "45%" }} />
              </div>
            </div>
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
              <StudentCard
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
  );
};

export default ClassroomDashboard;
