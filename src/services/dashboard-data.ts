
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
  metrics: StudentMetrics;
}

export interface StudentMetrics {
  attention: number;
  engagement: number;
  interaction_rate: number;
  move_distance: number;
  completed_tasks: number;
  task_success_rate: number;
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
    
    // Get activity history
    const { data: activityData, error: activityError } = await supabase
      .from("activity_history")
      .select("*")
      .eq("student_id", student.id)
      .order("timestamp", { ascending: true });
    
    if (activityError) {
      console.error(`Error fetching activity history for student ${student.id}:`, activityError);
    }
    
    // Get focus areas
    const { data: focusAreasData, error: focusAreasError } = await supabase
      .from("focus_areas")
      .select("*")
      .eq("student_id", student.id)
      .order("percentage", { ascending: false });
    
    if (focusAreasError) {
      console.error(`Error fetching focus areas for student ${student.id}:`, focusAreasError);
    }
    
    // Get menu interactions
    const { data: menuInteractionsData, error: menuInteractionsError } = await supabase
      .from("menu_interactions")
      .select("*")
      .eq("student_id", student.id);
    
    if (menuInteractionsError) {
      console.error(`Error fetching menu interactions for student ${student.id}:`, menuInteractionsError);
    }
    
    const metrics = metricsData || {};
    const activityHistory = (activityData || []).map(item => ({
      timestamp: item.timestamp,
      value: item.value
    }));
    
    const focusAreas = (focusAreasData || []).map(item => ({
      area: item.area,
      percentage: item.percentage
    }));
    
    // Convert menu interactions to the expected format
    const menuTypes: Record<string, number> = {};
    (menuInteractionsData || []).forEach(item => {
      menuTypes[item.menu_type] = item.count;
    });
    
    return {
      id: student.id,
      name: student.name,
      headset_id: student.headset_id,
      ip_address: student.ip_address,
      avatar: student.avatar,
      metrics: {
        attention: metrics.attention || 0,
        engagement: metrics.engagement || 0,
        interaction_rate: metrics.interaction_rate || 0,
        move_distance: metrics.move_distance || 0,
        completed_tasks: metrics.completed_tasks || 0,
        task_success_rate: metrics.task_success_rate || 0,
        activityHistory,
        focusAreas,
        interactionCounts: {
          blockGrabs: metrics.block_grabs || 0,
          blockReleases: metrics.block_releases || 0,
          menuInteractions: metrics.menu_interactions || 0,
          menuTypes
        },
        handPreference: {
          leftHandUsage: metrics.left_hand_usage || 0,
          rightHandUsage: metrics.right_hand_usage || 0,
          totalHandActions: metrics.total_hand_actions || 0
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
