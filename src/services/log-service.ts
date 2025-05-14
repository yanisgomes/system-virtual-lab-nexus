import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface RouterLog {
  id: string;
  created_at: string;
  student_id: string;
  log_type: string;
  message: string;
  metadata: any;
  // Additional fields used in the application
  source_ip: string;
  content: Json;
  timestamp: string;
  time_seconds: number;
  raw_log?: string;
}

export interface InteractionStatistic {
  id: string;
  log_type: string;
  source_ip: string;
  interaction_count: number;
  last_interaction: string | null;
}

export const fetchRouterLogs = async (
  limit: number = 20,
  offset: number = 0,
  sortByLatest: boolean = true,
): Promise<RouterLog[]> => {
  try {
    const { data, error } = await supabase
      .from("router_logs")
      .select("*")
      .order("timestamp", { ascending: !sortByLatest })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data as RouterLog[];
  } catch (error) {
    console.error("Error fetching router logs:", error);
    return [];
  }
};

export const fetchLatestLogs = async (
  limit: number = 20
): Promise<RouterLog[]> => {
  return fetchRouterLogs(limit, 0, true);
};

export const fetchLogsByStudentId = async (
  studentId: string,
  limit: number = 10
): Promise<RouterLog[]> => {
  try {
    const { data, error } = await supabase
      .from("router_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("timestamp", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as RouterLog[];
  } catch (error) {
    console.error("Error fetching logs by student ID:", error);
    return [];
  }
};

export const fetchInteractionStatistics = async (): Promise<InteractionStatistic[]> => {
  try {
    // This function would typically call a stored procedure or view
    // For now, we'll just aggregate the data manually
    const { data, error } = await supabase
      .from("router_logs")
      .select("log_type, source_ip, timestamp")
      .order("timestamp", { ascending: false });
    
    if (error) throw error;
    
    // Group by log_type and source_ip
    const statsMap = new Map<string, InteractionStatistic>();
    
    (data || []).forEach((log: any) => {
      const key = `${log.log_type}:${log.source_ip}`;
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          id: key,
          log_type: log.log_type,
          source_ip: log.source_ip,
          interaction_count: 1,
          last_interaction: log.timestamp
        });
      } else {
        const stat = statsMap.get(key)!;
        stat.interaction_count += 1;
        // Keep the latest interaction
        if (new Date(log.timestamp) > new Date(stat.last_interaction || "")) {
          stat.last_interaction = log.timestamp;
        }
      }
    });
    
    return Array.from(statsMap.values());
  } catch (error) {
    console.error("Error fetching interaction statistics:", error);
    return [];
  }
};

export const createRouterLog = async (logData: any): Promise<RouterLog | null> => {
  try {
    const { data, error } = await supabase
      .from("router_logs")
      .insert([logData])
      .select()
      .single();
    
    if (error) throw error;
    return data as RouterLog;
  } catch (error) {
    console.error("Error creating router log:", error);
    return null;
  }
};

// Alias for createRouterLog to match how it's called in StudentCardDemo.tsx
export const createRouterLogs = createRouterLog;

export const generateRandomLog = async (): Promise<RouterLog | null> => {
  try {
    // Call the generate_random_log RPC function
    const { data, error } = await supabase.rpc("generate_random_log", {});
    
    if (error) throw error;
    return data as RouterLog;
  } catch (error) {
    console.error("Error generating random log:", error);
    return null;
  }
};
