
import { supabase } from "@/integrations/supabase/client";

export interface RouterLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  source: string;
  details?: Record<string, any>;
}

export interface InteractionStatistic {
  id: number;
  date: string;
  student_id: string;
  interaction_type: string;
  count: number;
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
    
    return data || [];
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return [];
  }
}

// Fetch interaction statistics
export async function fetchInteractionStatistics(
  studentId?: string,
  startDate?: string,
  endDate?: string
): Promise<InteractionStatistic[]> {
  try {
    let query = supabase
      .from('interaction_statistics')
      .select('*')
      .order('date', { ascending: false });
      
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching interaction statistics:", error);
      return [];
    }
    
    return data || [];
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
