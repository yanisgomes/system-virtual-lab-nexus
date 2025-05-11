import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface RouterLog {
  id: string;
  timestamp: string;
  source_ip: string;
  log_type: string;
  content: Json;
  time_seconds: number;
  raw_log?: string;
}

export interface InteractionStatistic {
  id: string;
  source_ip: string;
  log_type: string;
  interaction_count: number;
  last_interaction: string | null;
}

export const fetchLatestLogs = async (limit = 100): Promise<RouterLog[]> => {
  try {
    const { data, error } = await supabase
      .from("router_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching logs:", error);
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchLatestLogs:", err);
    throw err;
  }
};

export const fetchLogsByType = async (logType: string, limit = 50): Promise<RouterLog[]> => {
  try {
    const { data, error } = await supabase
      .from("router_logs")
      .select("*")
      .eq("log_type", logType)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching logs of type ${logType}:`, error);
      throw new Error(`Failed to fetch logs by type: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchLogsByType:", err);
    throw err;
  }
};

export const fetchLogsByIp = async (sourceIp: string, limit = 50): Promise<RouterLog[]> => {
  try {
    const { data, error } = await supabase
      .from("router_logs")
      .select("*")
      .eq("source_ip", sourceIp)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching logs for IP ${sourceIp}:`, error);
      throw new Error(`Failed to fetch logs by IP: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchLogsByIp:", err);
    throw err;
  }
};

export const fetchInteractionStatistics = async (): Promise<InteractionStatistic[]> => {
  try {
    // Fix: Type the RPC response explicitly to work around TypeScript limitations
    const { data, error } = await supabase
      .rpc('get_interaction_statistics')
      .returns<InteractionStatistic[]>();

    if (error) {
      console.error("Error fetching interaction statistics:", error);
      throw new Error(`Failed to fetch interaction statistics: ${error.message}`);
    }

    // Return the data directly since it's already typed correctly
    return data || [];
  } catch (err) {
    console.error("Error in fetchInteractionStatistics:", err);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

export const createRouterLogs = async (logData: RouterLogInput): Promise<RouterLog | null> => {
  try {
    const { error, data } = await supabase
      .from('router_logs')
      .insert([
        {
          ...logData,
          timestamp: logData.timestamp || new Date().toISOString(),
        }
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating router log:', error);
      return null;
    }

    return data as RouterLog;
  } catch (error) {
    console.error('Error creating router log:', error);
    return null;
  }
};
