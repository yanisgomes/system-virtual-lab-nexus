import { supabase } from "@/integrations/supabase/client";

export interface Classroom {
  id: string;
  name: string;
}

export interface ClassroomMetrics {
  total_engagement: number;
  average_attention: number;
  active_students: number;
  session_duration: number;
}

export interface Student {
  id: string;
  name: string;
  headset_id: string;
  ip_address: string;
  avatar: string;
  classroom_id: string;
  metrics: StudentMetrics;
}

export interface StudentMetrics {
  attention: number;
  engagement: number;
  interaction_rate: number;
  move_distance: number;
  completed_tasks: number;
  task_success_rate: number;
  interactionCounts: {
    blockGrabs: number;
    blockReleases?: number;
    menuInteractions: number;
    menuTypes?: Record<string, number>;
  };
  activityHistory: {
    time: number;
    value: number;
    timestamp?: string;
  }[];
  focusAreas: {
    id: string;
    name: string;
    percentage: number;
  }[];
  handPreference: {
    leftHandUsage: number;
    rightHandUsage: number;
    totalHandActions: number;
  };
}

// Fetch classrooms from Supabase
export const fetchClassrooms = async (): Promise<Classroom[]> => {
  const { data, error } = await supabase.from("classrooms").select("*");
  
  if (error) {
    console.error("Error fetching classrooms:", error);
    return [];
  }
  
  return data || [];
};

// Fetch classroom data (students and metrics) from Supabase
export const fetchClassroomData = async (classroomId: string) => {
  try {
    // Get students for the classroom
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .eq("classroom_id", classroomId);
    
    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      return { students: [], metrics: { totalEngagement: 0, averageAttention: 0, activeStudents: 0, sessionDuration: 0 } };
    }
    
    // Get classroom metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from("classroom_metrics")
      .select("*")
      .eq("classroom_id", classroomId)
      .single();
    
    if (metricsError && metricsError.code !== 'PGRST116') {
      console.error("Error fetching classroom metrics:", metricsError);
    }
    
    const classroomMetrics: ClassroomMetrics = metricsData || {
      total_engagement: 0,
      average_attention: 0,
      active_students: 0,
      session_duration: 0
    };
    
    // Get complete student data with metrics for each student
    const students = await Promise.all(
      (studentsData || []).map(async (student) => {
        return await getStudentWithMetrics(student);
      })
    );
    
    // Format the metrics as expected by the frontend
    const metrics = {
      totalEngagement: classroomMetrics.total_engagement,
      averageAttention: classroomMetrics.average_attention,
      activeStudents: classroomMetrics.active_students || students.length,
      sessionDuration: classroomMetrics.session_duration || 45
    };
    
    return { students, metrics };
  } catch (error) {
    console.error("Error fetching classroom data:", error);
    return { students: [], metrics: { totalEngagement: 0, averageAttention: 0, activeStudents: 0, sessionDuration: 0 } };
  }
};

// Helper function to get complete student data with all metrics
const getStudentWithMetrics = async (student: any): Promise<Student> => {
  try {
    // Get student metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from("student_metrics")
      .select("*")
      .eq("student_id", student.id)
      .single();
    
    if (metricsError && metricsError.code !== 'PGRST116') {
      console.error(`Error fetching metrics for student ${student.id}:`, metricsError);
    }
    
    // Get router logs for this student
    const { data: logsData, error: logsError } = await supabase
      .from("router_logs")
      .select("*")
      .eq("source_ip", student.ip_address)
      .order("timestamp", { ascending: false })
      .limit(100);
    
    if (logsError) {
      console.error(`Error fetching logs for student ${student.id}:`, logsError);
    }
    
    // Process logs to create activity history (sample activity levels over time)
    const activityHistory = processActivityHistory(logsData || []);
    
    // Derive focus areas from router_logs
    const focusAreas = processFocusAreas(logsData || []);
    
    // Derive menu interactions from router_logs
    const { menuTypes, menuInteractions } = processMenuInteractions(logsData || []);
    
    // Derive block interactions from router_logs
    const { blockGrabs, blockReleases } = processBlockInteractions(logsData || []);
    
    // Derive hand usage from router_logs
    const { leftHandUsage, rightHandUsage, totalHandActions } = processHandUsage(logsData || []);
    
    // Create a metrics object with default values, then override with actual data if available
    const metrics = {
      attention: 0,
      engagement: 0,
      interaction_rate: 0,
      move_distance: 0,
      completed_tasks: 0,
      task_success_rate: 0,
      block_grabs: 0,
      block_releases: 0,
      menu_interactions: 0,
      left_hand_usage: 0,
      right_hand_usage: 0,
      total_hand_actions: 0,
      ...metricsData
    };
    
    return {
      id: student.id,
      name: student.name,
      headset_id: student.headset_id,
      ip_address: student.ip_address,
      avatar: student.avatar,
      classroom_id: student.classroom_id,
      metrics: {
        attention: metrics.attention,
        engagement: metrics.engagement,
        interaction_rate: metrics.interaction_rate,
        move_distance: metrics.move_distance,
        completed_tasks: metrics.completed_tasks,
        task_success_rate: metrics.task_success_rate,
        activityHistory,
        focusAreas,
        interactionCounts: {
          blockGrabs: blockGrabs || metrics.block_grabs,
          blockReleases: blockReleases || metrics.block_releases,
          menuInteractions: menuInteractions || metrics.menu_interactions,
          menuTypes
        },
        handPreference: {
          leftHandUsage: leftHandUsage || metrics.left_hand_usage,
          rightHandUsage: rightHandUsage || metrics.right_hand_usage,
          totalHandActions: totalHandActions || metrics.total_hand_actions
        }
      }
    };
  } catch (error) {
    console.error(`Error getting complete metrics for student ${student.id}:`, error);
    return {
      ...student,
      metrics: {
        attention: 0,
        engagement: 0,
        interaction_rate: 0,
        move_distance: 0,
        completed_tasks: 0,
        task_success_rate: 0,
        activityHistory: [],
        focusAreas: [],
        interactionCounts: {
          blockGrabs: 0,
          blockReleases: 0,
          menuInteractions: 0,
          menuTypes: {}
        },
        handPreference: {
          leftHandUsage: 0,
          rightHandUsage: 0,
          totalHandActions: 0
        }
      }
    };
  }
};

// Function to process router logs into activity history
const processActivityHistory = (logs: any[]): { time: number; value: number; timestamp?: string }[] => {
  if (logs.length === 0) return [];
  
  // Group logs by 5-minute intervals and count interactions as engagement
  const timeIntervals: Record<string, { count: number, timestamp: number }> = {};
  const now = new Date();
  const twoHoursAgo = new Date(now);
  twoHoursAgo.setHours(now.getHours() - 2);
  
  // Create evenly spaced intervals for the last 2 hours
  for (let i = 0; i < 24; i++) {
    const time = new Date(twoHoursAgo);
    time.setMinutes(twoHoursAgo.getMinutes() + (i * 5));
    const timeKey = Math.floor(time.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000);
    timeIntervals[timeKey] = { count: 0, timestamp: timeKey };
  }
  
  // Count logs per interval
  logs.forEach(log => {
    const logTime = new Date(log.timestamp).getTime();
    const intervalKey = Math.floor(logTime / (5 * 60 * 1000)) * (5 * 60 * 1000);
    
    if (timeIntervals[intervalKey]) {
      timeIntervals[intervalKey].count += 1;
    }
  });
  
  // Convert counts to activity levels (0-100)
  const maxCount = Math.max(...Object.values(timeIntervals).map(v => v.count), 1);
  const activityHistory = Object.values(timeIntervals)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ count, timestamp }) => ({
      time: timestamp,
      value: Math.min(Math.round((count / maxCount) * 100), 100),
      timestamp: new Date(timestamp).toISOString()
    }));
  
  return activityHistory;
};

// Function to process router logs into focus areas
const processFocusAreas = (logs: any[]): { id: string; name: string; percentage: number }[] => {
  if (logs.length === 0) {
    return [
      { id: "Building", name: "Building", percentage: 45 },
      { id: "Exploration", name: "Exploration", percentage: 30 },
      { id: "Collaboration", name: "Collaboration", percentage: 15 },
      { id: "Physics", name: "Physics", percentage: 10 }
    ];
  }
  
  // Categorize logs by content type
  const areas: Record<string, number> = {
    Building: 0,
    Exploration: 0,
    Collaboration: 0,
    Physics: 0,
    Menu: 0
  };
  
  logs.forEach(log => {
    // Categorize based on log_type and content
    if (log.log_type === 'BlockAction' || log.content?.action === 'place' || log.content?.action === 'delete') {
      areas.Building += 1;
    } else if (log.log_type === 'Movement') {
      areas.Exploration += 1;
    } else if (log.log_type === 'MenuButton') {
      areas.Menu += 1;
    } else if (log.log_type === 'Interaction' && log.content?.target?.includes('physics')) {
      areas.Physics += 1;
    } else if (log.log_type === 'MultiplayerEvent' || (log.content && (log.content.type === 'voice' || log.content.type === 'chat'))) {
      areas.Collaboration += 1;
    } else {
      // Default to exploration for unknown types
      areas.Exploration += 1;
    }
  });
  
  // Calculate percentages
  const total = Object.values(areas).reduce((sum, count) => sum + count, 0) || 1;
  
  return Object.entries(areas)
    .map(([area, count]) => ({
      id: area,
      name: area,
      percentage: Math.round((count / total) * 100)
    }))
    .filter(area => area.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
};

// Function to process router logs into menu interactions
const processMenuInteractions = (logs: any[]): { menuTypes: Record<string, number>, menuInteractions: number } => {
  const menuTypes: Record<string, number> = {};
  let menuInteractions = 0;
  
  logs.forEach(log => {
    if (log.log_type === 'MenuButton' && log.content?.buttonName) {
      menuInteractions++;
      
      // Extract the button name and normalize it
      const buttonName = String(log.content.buttonName)
        .replace(/Btn/gi, '')
        .replace(/Button/gi, '');
      
      if (!menuTypes[buttonName]) {
        menuTypes[buttonName] = 1;
      } else {
        menuTypes[buttonName]++;
      }
    }
  });
  
  return { menuTypes, menuInteractions };
};

// Function to process router logs into block interactions
const processBlockInteractions = (logs: any[]): { blockGrabs: number, blockReleases: number } => {
  let blockGrabs = 0;
  let blockReleases = 0;
  
  logs.forEach(log => {
    if (log.log_type === 'BlockAction') {
      if (log.content?.action === 'grab' || log.content?.action === 'pick') {
        blockGrabs++;
      } else if (log.content?.action === 'release' || log.content?.action === 'place') {
        blockReleases++;
      }
    }
  });
  
  return { blockGrabs, blockReleases };
};

// Function to process router logs into hand usage data
const processHandUsage = (logs: any[]): { leftHandUsage: number, rightHandUsage: number, totalHandActions: number } => {
  let leftHandUsage = 0;
  let rightHandUsage = 0;
  
  logs.forEach(log => {
    if (
      (log.content?.hand === 'left' || log.content?.handedness === 'left') ||
      (log.content?.controller === 'left')
    ) {
      leftHandUsage++;
    } else if (
      (log.content?.hand === 'right' || log.content?.handedness === 'right') ||
      (log.content?.controller === 'right')
    ) {
      rightHandUsage++;
    }
    // If hand is not specified, we don't count it
  });
  
  const totalHandActions = leftHandUsage + rightHandUsage;
  
  return { leftHandUsage, rightHandUsage, totalHandActions };
};
