import { ActivityDataPoint } from "@/components/dashboard/ActivityChart";
import { supabaseClient } from "./supabase";

export interface RouterLog {
  id?: number;
  time_seconds: number;
  source_ip: string;
  log_type: string;
  content: any;
}

export const createRouterLog = async (log: RouterLog) => {
  try {
    const { data, error } = await supabaseClient
      .from('router_logs')
      .insert([log])
      .select();

    if (error) {
      console.error("Failed to create router log:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to create router log:", error);
    return null;
  }
};

export const getStudentActivityHistory = async (studentId: string): Promise<ActivityDataPoint[]> => {
  try {
    const { data, error } = await supabaseClient
      .from('activity_history')
      .select()
      .eq('student_id', studentId)
      .order('timestamp');
      
    if (error) {
      console.error('Error fetching student activity history:', error);
      return [];
    }
    
    return data.map(item => ({
      time: item.timestamp,
      value: item.value
    }));
  } catch (error) {
    console.error('Failed to fetch student activity history:', error);
    return [];
  }
}

export const getRecentRouterLogs = async (minutes: number = 5): Promise<RouterLog[]> => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabaseClient
      .from('router_logs')
      .select('*')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching recent router logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching recent router logs:", error);
    return [];
  }
};
