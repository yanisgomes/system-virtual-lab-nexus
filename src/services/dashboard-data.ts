
export interface Classroom {
  id: string;
  name: string;
}

export interface ClassroomMetrics {
  totalEngagement: number;
  averageAttention: number;
  activeStudents: number;
  sessionDuration: number;
}

export interface Student {
  id: string;
  name: string;
  headsetId: string;
  avatar: string;
  metrics: StudentMetrics;
}

export interface StudentMetrics {
  attention: number;
  engagement: number;
  interactionRate: number;
  moveDistance: number;
  completedTasks: number;
  taskSuccessRate: number;
  activityHistory: { timestamp: number; value: number }[];
  focusAreas: { area: string; percentage: number }[];
}

// Mock classrooms
export const classrooms: Classroom[] = [
  { id: "c1", name: "Biology 101" },
  { id: "c2", name: "Chemistry Lab" },
  { id: "c3", name: "Physics Concepts" },
  { id: "c4", name: "Math Workshop" },
  { id: "c5", name: "Geography Tour" },
];

// Generate random time series data
const generateTimeSeriesData = (points = 12) => {
  return Array.from({ length: points }, (_, i) => ({
    timestamp: Date.now() - (points - i) * 300000, // 5 minute intervals
    value: Math.floor(Math.random() * 100),
  }));
};

// Generate random focus areas
const generateFocusAreas = () => {
  const areas = ["Visual Content", "Audio Content", "Interactive Elements", "Text Content", "3D Models"];
  return areas.map((area) => ({
    area,
    percentage: Math.floor(Math.random() * 100),
  })).sort((a, b) => b.percentage - a.percentage);
};

// Generate random metrics for a student
const generateStudentMetrics = (): StudentMetrics => ({
  attention: Math.floor(Math.random() * 100),
  engagement: Math.floor(Math.random() * 100),
  interactionRate: Math.floor(Math.random() * 100),
  moveDistance: Math.floor(Math.random() * 1000) / 10,
  completedTasks: Math.floor(Math.random() * 10),
  taskSuccessRate: Math.floor(Math.random() * 100),
  activityHistory: generateTimeSeriesData(),
  focusAreas: generateFocusAreas(),
});

// Generate random students
export const generateStudents = (count: number): Student[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    name: `Student ${i + 1}`,
    headsetId: `VR-${1000 + i}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
    metrics: generateStudentMetrics(),
  }));
};

// Generate classroom metrics
export const generateClassroomMetrics = (students: Student[]): ClassroomMetrics => {
  const totalEngagement = Math.round(
    students.reduce((sum, student) => sum + student.metrics.engagement, 0) / students.length
  );
  
  const averageAttention = Math.round(
    students.reduce((sum, student) => sum + student.metrics.attention, 0) / students.length
  );
  
  return {
    totalEngagement,
    averageAttention,
    activeStudents: students.length,
    sessionDuration: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
  };
};

// Mock data for each classroom
export const classroomData = classrooms.reduce((acc, classroom) => {
  const studentCount = Math.floor(Math.random() * 15) + 10; // 10-25 students
  const students = generateStudents(studentCount);
  const metrics = generateClassroomMetrics(students);
  
  acc[classroom.id] = {
    students,
    metrics,
  };
  
  return acc;
}, {} as Record<string, { students: Student[], metrics: ClassroomMetrics }>);

// Simulate fetching classroom data
export const fetchClassroomData = (classroomId: string) => {
  return new Promise<{ students: Student[], metrics: ClassroomMetrics }>((resolve) => {
    setTimeout(() => {
      resolve(classroomData[classroomId] || { students: [], metrics: { totalEngagement: 0, averageAttention: 0, activeStudents: 0, sessionDuration: 0 } });
    }, 300);
  });
};
