
import { supabase } from "@/integrations/supabase/client";

export interface RouterLog {
  time_seconds: number;
  source_ip: string;
  log_type: string;
  content: any; // Use a more specific type when possible
}

interface InteractionStatisticsResponse {
  menu_interactions: number;
  block_grabs: number;
}

// Create a new router log entry
export const createRouterLog = async (log: RouterLog) => {
  try {
    const { data, error } = await supabase
      .from('router_logs')
      .insert([log])
      .select();

    if (error) {
      console.error('Error creating router log:', error);
      throw error;
    }

    return data[0];
  } catch (err) {
    console.error('Error in createRouterLog:', err);
    throw err;
  }
};

// Fetch router logs by IP address with pagination
export const fetchRouterLogsByIP = async (
  ip: string,
  page = 1,
  limit = 20
) => {
  try {
    const { data, error, count } = await supabase
      .from('router_logs')
      .select('*', { count: 'exact' })
      .eq('source_ip', ip)
      .order('time_seconds', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching router logs:', error);
      throw error;
    }

    return { logs: data || [], total: count || 0 };
  } catch (err) {
    console.error('Error in fetchRouterLogsByIP:', err);
    throw err;
  }
};

// Get recent activity logs by IP
export const getRecentActivityByIP = async (ip: string, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('router_logs')
      .select('*')
      .eq('source_ip', ip)
      .order('time_seconds', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Error in getRecentActivityByIP:', err);
    throw err;
  }
};

// Get interaction statistics for a specific IP
export const getInteractionStatistics = async (ip: string): Promise<InteractionStatisticsResponse> => {
  try {
    const { data, error } = await supabase
      .rpc('get_interaction_statistics', { ip_address: ip }) as { data: InteractionStatisticsResponse, error: any };

    if (error) {
      console.error('Error getting interaction statistics:', error);
      // Return default values on error
      return { menu_interactions: 0, block_grabs: 0 };
    }

    return data || { menu_interactions: 0, block_grabs: 0 };
  } catch (err) {
    console.error('Error in getInteractionStatistics:', err);
    return { menu_interactions: 0, block_grabs: 0 };
  }
};

// Get interaction counts by type for a specific IP
export const getInteractionsByType = async (ip: string) => {
  try {
    const { data, error } = await supabase
      .from('router_logs')
      .select('log_type, count')
      .eq('source_ip', ip)
      .in('log_type', ['MenuOpen', 'MenuClose', 'BlockGrab', 'BlockRelease'])
      .order('log_type');

    if (error) {
      console.error('Error getting interactions by type:', error);
      // Return default structure on error
      return [
        { log_type: 'MenuOpen', count: 0 },
        { log_type: 'MenuClose', count: 0 },
        { log_type: 'BlockGrab', count: 0 },
        { log_type: 'BlockRelease', count: 0 },
      ];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getInteractionsByType:', err);
    throw err;
  }
};

// Get recent activities for all students
export const getAllStudentsActivity = async (limit = 5) => {
  try {
    // First, get all unique IPs
    const { data: ips, error: ipError } = await supabase
      .from('router_logs')
      .select('source_ip')
      .order('time_seconds', { ascending: false })
      .limit(100);

    if (ipError) {
      console.error('Error fetching IPs:', ipError);
      throw ipError;
    }

    // Get unique IPs
    const uniqueIPs = [...new Set(ips?.map(item => item.source_ip))];

    // For each IP, get their recent activities
    const activities = await Promise.all(
      uniqueIPs.map(async ip => {
        const logs = await getRecentActivityByIP(ip, limit);
        return {
          ip,
          logs,
        };
      })
    );

    return activities;
  } catch (err) {
    console.error('Error in getAllStudentsActivity:', err);
    throw err;
  }
};
