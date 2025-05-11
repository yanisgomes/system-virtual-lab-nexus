
import { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

// Type definitions
export interface RouterLog {
  id: string;
  source_ip: string;
  log_type: string;
  content: Json;
  timestamp: string;
  time_seconds: number;
}

export interface InteractionStatistic {
  id: string;
  source_ip: string;
  log_type: string;
  interaction_count: number;
  last_interaction: string | null;
}

/**
 * Fetches the latest router logs from the database
 * @param limit The maximum number of logs to fetch
 * @returns Promise with array of RouterLog objects
 */
export const fetchLatestLogs = async (limit: number = 20): Promise<RouterLog[]> => {
  try {
    const { data, error } = await supabase
      .from('router_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching logs:", error);
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }
    
    return data as RouterLog[];
  } catch (error) {
    console.error("Exception while fetching logs:", error);
    throw error;
  }
};

/**
 * Fetches interaction statistics from the database
 * @returns Promise with array of InteractionStatistic objects
 */
export const fetchInteractionStatistics = async (): Promise<InteractionStatistic[]> => {
  try {
    // Fix: Correctly calling the RPC function with an empty object for the params
    const { data, error } = await supabase
      .rpc('get_interaction_statistics', {});
    
    if (error) {
      console.error("Error fetching statistics:", error);
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
    
    return (data || []) as InteractionStatistic[];
  } catch (error) {
    console.error("Exception while fetching statistics:", error);
    throw error;
  }
};

/**
 * Creates a new router log entry in the database
 * @param log The log object to create
 * @returns Promise with the created log
 */
export const createRouterLogs = async (log: Omit<RouterLog, 'id' | 'timestamp'>): Promise<RouterLog> => {
  try {
    // Calculate time_seconds if not provided
    const logData = {
      ...log,
      time_seconds: log.time_seconds || 0
    };

    const { data, error } = await supabase
      .from('router_logs')
      .insert(logData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating log:", error);
      throw new Error(`Failed to create log: ${error.message}`);
    }
    
    return data as RouterLog;
  } catch (error) {
    console.error("Exception while creating log:", error);
    throw error;
  }
};

/**
 * Fetches logs for a specific student based on their IP address
 * @param sourceIp The IP address to filter logs by
 * @param limit The maximum number of logs to fetch
 * @returns Promise with array of RouterLog objects
 */
export const fetchLogsBySourceIp = async (sourceIp: string, limit: number = 30): Promise<RouterLog[]> => {
  try {
    const { data, error } = await supabase
      .from('router_logs')
      .select('*')
      .eq('source_ip', sourceIp)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error(`Error fetching logs for IP ${sourceIp}:`, error);
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }
    
    return data as RouterLog[];
  } catch (error) {
    console.error("Exception while fetching logs by IP:", error);
    throw error;
  }
};
