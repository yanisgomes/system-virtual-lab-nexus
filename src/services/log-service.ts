import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface RouterLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  source: string;
  details?: Record<string, any>;
  // Map to DB schema fields
  source_ip?: string;
  log_type?: string;
  content?: Json;
  time_seconds?: number;
}

export interface InteractionStatistic {
  id: number;
  date: string;
  student_id: string;
  interaction_type: string;
  count: number;
  // Map to DB schema fields
  source_ip?: string;
  log_type?: string;
  interaction_count?: number;
  last_interaction?: string;
}

// Fetch the latest logs from the database
export async function fetchLatestLogs(limit = 100): Promise<RouterLog[]> {
  try {
    const { data, error } = await supabase
      .from('router_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
    
    // Map database fields to RouterLog interface
    return data?.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.log_type || 'info',
      message: typeof log.content === 'object' ? JSON.stringify(log.content) : String(log.content),
      source: log.source_ip,
      details: typeof log.content === 'object' ? log.content : {},
      // Keep original fields for backward compatibility
      source_ip: log.source_ip,
      log_type: log.log_type,
      content: log.content,
      time_seconds: log.time_seconds
    })) || [];
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return [];
  }
}

// Create a new router log
export async function createRouterLog(logData: {
  source_ip: string;
  log_type: string;
  content: any;
  time_seconds: number;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('router_logs')
      .insert(logData);
      
    if (error) {
      console.error("Error creating log:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to create log:", error);
    return false;
  }
}

// Fetch interaction statistics
export async function fetchInteractionStatistics(
  studentId?: string,
  startDate?: string,
  endDate?: string
): Promise<InteractionStatistic[]> {
  try {
    // Since 'interaction_statistics' table might not exist, we'll aggregate from router_logs
    const { data, error } = await supabase
      .from('router_logs')
      .select('source_ip, log_type, count(*) as interaction_count, max(timestamp) as last_interaction')
      .group('source_ip, log_type')
      .order('source_ip', { ascending: true });
      
    if (error) {
      console.error("Error fetching interaction statistics:", error);
      return [];
    }
    
    // Map to InteractionStatistic interface
    return data?.map((item, index) => ({
      id: index + 1,
      date: new Date().toISOString().split('T')[0],
      student_id: item.source_ip,
      interaction_type: item.log_type,
      count: item.interaction_count || 0,
      // Keep original fields for backward compatibility
      source_ip: item.source_ip,
      log_type: item.log_type,
      interaction_count: item.interaction_count,
      last_interaction: item.last_interaction
    })) || [];
  } catch (error) {
    console.error("Failed to fetch interaction statistics:", error);
    return [];
  }
}

// Mock data for logs when not connected to real backend
export function getMockLogs(count = 20): RouterLog[] {
  const levels = ["info", "warning", "error", "debug"];
  const sources = ["system", "student", "admin", "headset"];
  const messages = [
    "User logged in",
    "Connection established",
    "Operation completed successfully",
    "Resource not found",
    "Permission denied",
    "Process started",
    "Data synchronized"
  ];

  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 5);
    
    return {
      id: `log-${i}`,
      timestamp: date.toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      details: {
        user: `user-${Math.floor(Math.random() * 10)}`,
        action: `action-${Math.floor(Math.random() * 5)}`
      }
    };
  });
}

// Mock interaction statistics
export function getMockInteractionStatistics(count = 15): InteractionStatistic[] {
  const interactionTypes = ["menu_open", "block_grab", "tool_use", "navigation"];
  const studentIds = ["s-001", "s-002", "s-003", "s-004", "s-005"];

  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(i / 3));
    
    return {
      id: i + 1,
      date: date.toISOString().split('T')[0],
      student_id: studentIds[Math.floor(Math.random() * studentIds.length)],
      interaction_type: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
      count: Math.floor(Math.random() * 50) + 1
    };
  });
}
