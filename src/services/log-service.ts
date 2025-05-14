
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface ActivityDataPoint {
  time: number;
  value: number;
}

export interface RouterLog {
  id?: string;
  time_seconds: number;
  source_ip: string;
  log_type: string;
  content: any;
  timestamp?: string;
  source?: string;
  level?: string;
  details?: any;
}

export interface InteractionStatistic {
  id: number;
  log_type?: string;
  interaction_type?: string;
  source_ip?: string;
  student_id?: string;
  interaction_count?: number;
  count?: number;
  last_interaction?: string;
}

export const createRouterLog = async (log: RouterLog) => {
  try {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('activity_history')
      .select()
      .eq('student_id', studentId)
      .order('timestamp');

    if (error) {
      console.error('Error fetching student activity history:', error);
      return [];
    }

    return data.map((item) => ({
      time: item.timestamp,
      value: item.value
    }));
  } catch (error) {
    console.error('Failed to fetch student activity history:', error);
    return [];
  }
};

export const getRecentRouterLogs = async (minutes: number = 5): Promise<RouterLog[]> => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('router_logs')
      .select('*')
      .gte('timestamp', cutoff)
      .order('timestamp', { ascending: false });

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

export const fetchLatestLogs = async (limit: number = 20): Promise<RouterLog[]> => {
  try {
    const { data, error } = await supabase
      .from('router_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching latest logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching latest logs:", error);
    return [];
  }
};

export const fetchInteractionStatistics = async (): Promise<InteractionStatistic[]> => {
  try {
    // Using raw SQL query instead of the unsupported .group() method
    const { data, error } = await supabase
      .rpc('get_interaction_statistics');

    if (error) {
      console.error("Error fetching interaction statistics:", error);
      return [];
    }

    // Format the results as needed
    const formattedData = data ? data.map((item: any, index: number) => ({
      id: index + 1,
      log_type: item.log_type,
      source_ip: item.source_ip,
      count: parseInt(item.count),
      last_interaction: item.last_interaction || new Date().toISOString()
    })) : [];

    return formattedData;
  } catch (error) {
    console.error("Error fetching interaction statistics:", error);
    return [];
  }
};
