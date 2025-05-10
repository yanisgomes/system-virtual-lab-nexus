
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
  ipAddress: string;
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
  interactionCounts: {
    blockGrabs: number;
    blockReleases: number;
    menuInteractions: number;
    menuTypes: Record<string, number>;
  };
  handPreference: {
    leftHandUsage: number;
    rightHandUsage: number;
    totalHandActions: number;
  };
}

// Mock classrooms
export const classrooms: Classroom[] = [
  { id: "c1", name: "Biology 101" },
  { id: "c2", name: "Chemistry Lab" },
  { id: "c3", name: "Physics Concepts" },
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

// Real headset data based on logs
const headsetData = {
  "192.168.50.192": {
    id: "s1",
    name: "Emma Johnson",
    headsetId: "VR-1001",
    ipAddress: "192.168.50.192",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    metrics: {
      attention: 78,
      engagement: 85,
      interactionRate: 92,
      moveDistance: 45.3,
      completedTasks: 7,
      taskSuccessRate: 82,
      activityHistory: generateTimeSeriesData(),
      focusAreas: generateFocusAreas(),
      interactionCounts: {
        blockGrabs: 12,
        blockReleases: 11,
        menuInteractions: 0,
        menuTypes: {}
      },
      handPreference: {
        leftHandUsage: 3,
        rightHandUsage: 9,
        totalHandActions: 12
      }
    }
  },
  "192.168.50.235": {
    id: "s2",
    name: "Michael Chen",
    headsetId: "VR-1002",
    ipAddress: "192.168.50.235",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    metrics: {
      attention: 65,
      engagement: 72,
      interactionRate: 68,
      moveDistance: 32.8,
      completedTasks: 5,
      taskSuccessRate: 75,
      activityHistory: generateTimeSeriesData(),
      focusAreas: generateFocusAreas(),
      interactionCounts: {
        blockGrabs: 0,
        blockReleases: 0,
        menuInteractions: 16,
        menuTypes: {
          "BtnInfo": 9,
          "BtnEnergy": 4,
          "BtnMatter": 4,
          "BtnRaisedHand": 1
        }
      },
      handPreference: {
        leftHandUsage: 0,
        rightHandUsage: 0,
        totalHandActions: 0
      }
    }
  },
  "192.168.50.193": {  // Additional student with mock data
    id: "s3",
    name: "Sophia Martinez",
    headsetId: "VR-1003",
    ipAddress: "192.168.50.193",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    metrics: {
      attention: 88,
      engagement: 91,
      interactionRate: 76,
      moveDistance: 28.5,
      completedTasks: 8,
      taskSuccessRate: 95,
      activityHistory: generateTimeSeriesData(),
      focusAreas: generateFocusAreas(),
      interactionCounts: {
        blockGrabs: 6,
        blockReleases: 6,
        menuInteractions: 8,
        menuTypes: {
          "BtnInfo": 4,
          "BtnEnergy": 2,
          "BtnMatter": 2
        }
      },
      handPreference: {
        leftHandUsage: 1,
        rightHandUsage: 5,
        totalHandActions: 6
      }
    }
  }
};

const studentsArray = Object.values(headsetData);

// Generate classroom metrics based on real student data
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
    sessionDuration: 45, // 45 minutes
  };
};

// Mock data for each classroom
export const classroomData = classrooms.reduce((acc, classroom, index) => {
  // First classroom gets the real headset data
  const students = index === 0 ? studentsArray : generateStudents(3);
  const metrics = generateClassroomMetrics(students);
  
  acc[classroom.id] = {
    students,
    metrics,
  };
  
  return acc;
}, {} as Record<string, { students: Student[], metrics: ClassroomMetrics }>);

// Generate random students (only for non-first classroom)
export const generateStudents = (count: number): Student[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 10}`,
    name: `Student ${i + 10}`,
    headsetId: `VR-${1010 + i}`,
    ipAddress: `192.168.50.${200 + i}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`,
    metrics: generateStudentMetrics(),
  }));
};

// Generate random metrics for a student
const generateStudentMetrics = (): StudentMetrics => {
  const blockGrabs = Math.floor(Math.random() * 10);
  const blockReleases = blockGrabs - Math.floor(Math.random() * 3);
  const menuInteractions = Math.floor(Math.random() * 12);
  
  return {
    attention: Math.floor(Math.random() * 100),
    engagement: Math.floor(Math.random() * 100),
    interactionRate: Math.floor(Math.random() * 100),
    moveDistance: Math.floor(Math.random() * 1000) / 10,
    completedTasks: Math.floor(Math.random() * 10),
    taskSuccessRate: Math.floor(Math.random() * 100),
    activityHistory: generateTimeSeriesData(),
    focusAreas: generateFocusAreas(),
    interactionCounts: {
      blockGrabs,
      blockReleases,
      menuInteractions,
      menuTypes: {
        "BtnInfo": Math.floor(Math.random() * 5),
        "BtnEnergy": Math.floor(Math.random() * 4),
        "BtnMatter": Math.floor(Math.random() * 3),
        "BtnRaisedHand": Math.floor(Math.random() * 2),
      }
    },
    handPreference: {
      leftHandUsage: Math.floor(Math.random() * 5),
      rightHandUsage: Math.floor(Math.random() * 8),
      get totalHandActions() { return this.leftHandUsage + this.rightHandUsage; }
    }
  };
};

// Simulate fetching classroom data
export const fetchClassroomData = (classroomId: string) => {
  return new Promise<{ students: Student[], metrics: ClassroomMetrics }>((resolve) => {
    setTimeout(() => {
      resolve(classroomData[classroomId] || { students: [], metrics: { totalEngagement: 0, averageAttention: 0, activeStudents: 0, sessionDuration: 0 } });
    }, 300);
  });
};
