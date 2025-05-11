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
    // Fix: Use a raw SQL query instead since interaction_statistics is not in the type definitions
    const { data, error } = await supabase
      .rpc('get_interaction_statistics')
      .select();

    if (error) {
      console.error("Error fetching interaction statistics:", error);
      throw new Error(`Failed to fetch interaction statistics: ${error.message}`);
    }

    // Ensure we're returning the correct type
    const typedData: InteractionStatistic[] = (data || []).map(item => ({
      id: item.id || '',
      source_ip: item.source_ip || '',
      log_type: item.log_type || '',
      interaction_count: item.interaction_count || 0,
      last_interaction: item.last_interaction || null
    }));

    return typedData;
  } catch (err) {
    console.error("Error in fetchInteractionStatistics:", err);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};
