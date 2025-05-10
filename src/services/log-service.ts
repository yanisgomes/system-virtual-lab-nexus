
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface RouterLog {
  id: string;
  timestamp: string;
  source_ip: string;
  log_type: string;
  content: Json;  // Changed from Record<string, any> to Json
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
  const { data, error } = await supabase
    .from("router_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }

  return data || [];
};

export const fetchLogsByType = async (logType: string, limit = 50): Promise<RouterLog[]> => {
  const { data, error } = await supabase
    .from("router_logs")
    .select("*")
    .eq("log_type", logType)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching logs of type ${logType}:`, error);
    return [];
  }

  return data || [];
};

export const fetchLogsByIp = async (sourceIp: string, limit = 50): Promise<RouterLog[]> => {
  const { data, error } = await supabase
    .from("router_logs")
    .select("*")
    .eq("source_ip", sourceIp)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching logs for IP ${sourceIp}:`, error);
    return [];
  }

  return data || [];
};

export const fetchInteractionStatistics = async (): Promise<InteractionStatistic[]> => {
  const { data, error } = await supabase
    .from("interaction_statistics")
    .select("*")
    .order("interaction_count", { ascending: false });

  if (error) {
    console.error("Error fetching interaction statistics:", error);
    return [];
  }

  return data || [];
};
