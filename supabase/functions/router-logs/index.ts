
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create Supabase client
const supabaseUrl = "https://xdzoslgjemunetuztrfg.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let body;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("text/plain")) {
      const text = await req.text();
      body = parseLogText(text);
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported content type" }),
        { 
          status: 415, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Ensure we have logs to process
    if (!body || !Array.isArray(body.logs) && !body.log) {
      return new Response(
        JSON.stringify({ error: "Invalid log format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Process logs - handle both array of logs or single log
    const logs = Array.isArray(body.logs) ? body.logs : [body.log || body];
    const results = await processLogs(logs);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.processed,
        errors: results.errors 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error processing request:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Process multiple logs
async function processLogs(logs: any[]) {
  const results = {
    processed: 0,
    errors: 0
  };

  // Process logs in batches for better performance
  const batchSize = 10;
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize);
    const batchPromises = batch.map(processLog);
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    results.processed += batchResults.filter(r => r.status === "fulfilled").length;
    results.errors += batchResults.filter(r => r.status === "rejected").length;
  }

  return results;
}

// Process a single log entry
async function processLog(log: any) {
  try {
    // Extract required data
    const sourceIp = log.sourceIp || log.source_ip || extractIpFromLog(log);
    const logType = log.type || log.log_type || "unknown";
    const content = log.content || {};
    const timeSeconds = log.time || log.time_seconds || 0;
    const rawLog = JSON.stringify(log);

    // Skip if we don't have required fields
    if (!sourceIp || !logType) {
      console.error("Missing required log fields:", log);
      return false;
    }

    // Insert log into database
    const { error } = await supabase
      .from("router_logs")
      .insert({
        source_ip: sourceIp,
        log_type: logType,
        content: content,
        time_seconds: timeSeconds,
        raw_log: rawLog
      });

    if (error) {
      throw new Error(`Database insert error: ${error.message}`);
    }

    // Update statistics table
    await updateStatistics(sourceIp, logType);
    
    return true;
  } catch (error) {
    console.error("Error processing log:", error);
    throw error;
  }
}

// Update interaction statistics
async function updateStatistics(sourceIp: string, logType: string) {
  try {
    // Use upsert to update statistics or insert if not exists
    await supabase
      .from("interaction_statistics")
      .upsert(
        {
          source_ip: sourceIp,
          log_type: logType,
          interaction_count: 1,  // Will be added to existing count with onConflict
          last_interaction: new Date().toISOString()
        },
        {
          onConflict: "source_ip,log_type",
          ignoreDuplicates: false
        }
      )
      .select();

    // Update the count with an increment
    await supabase.rpc(
      "increment_interaction_count",
      { ip: sourceIp, log_t: logType }
    ).select();
  } catch (error) {
    console.error("Error updating statistics:", error);
    // Don't throw the error - logging should continue even if stats update fails
  }
}

// Parse log text in the format "IP -> JSON_DATA"
function parseLogText(text: string) {
  try {
    const logs = [];
    const lines = text.split("\n").filter(line => line.trim());

    for (const line of lines) {
      // Match the pattern "IP -> JSON_DATA"
      const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s*->\s*(\{.+)/);
      
      if (match) {
        const sourceIp = match[1];
        let jsonData;
        
        try {
          // Parse the JSON data part
          jsonData = JSON.parse(match[2]);
          
          logs.push({
            sourceIp: sourceIp,
            type: jsonData.type,
            content: jsonData.content,
            time: jsonData.time,
            raw_log: line
          });
        } catch (e) {
          console.error(`Failed to parse JSON from line: ${line}`);
          // Add as raw log if JSON parsing fails
          logs.push({
            sourceIp: sourceIp,
            type: "unknown",
            content: {},
            time: 0,
            raw_log: line
          });
        }
      }
    }

    return { logs };
  } catch (error) {
    console.error("Error parsing log text:", error);
    return { logs: [] };
  }
}

// Extract IP from log if it's in a different format
function extractIpFromLog(log: any): string | null {
  // If the log is a string and contains an IP pattern
  if (typeof log === "string") {
    const match = log.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    return match ? match[0] : null;
  }

  // Check various possible fields that might contain the IP
  return log.ip || log.source || log.src || null;
}
