import { supabase } from "@/integrations/supabase/client";

export interface RouterLog {
  id: string;
  created_at: string;
  student_id: string;
  log_type: string;
  message: string;
  metadata: any;
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
      .order("created_at", { ascending: !sortByLatest })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching router logs:", error);
    return [];
  }
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
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching logs by student ID:", error);
    return [];
  }
};

export const createRouterLog = async (logData: any): Promise<RouterLog | null> => {
  try {
    // Call the create_router_log RPC function with the log data
    const { data, error } = await supabase.rpc("create_router_log", {});
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating router log:", error);
    return null;
  }
};

export const generateRandomLog = async (): Promise<RouterLog | null> => {
  try {
    // Call the generate_random_log RPC function
    const { data, error } = await supabase.rpc("generate_random_log", {});
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error generating random log:", error);
    return null;
  }
};
