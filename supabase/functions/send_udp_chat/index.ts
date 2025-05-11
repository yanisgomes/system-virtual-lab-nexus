
// Follow Deno and Supabase Edge Function patterns
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default UDP port for VR headsets
const PORT = 50000;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const { ip, content, sender = "teacher" } = await req.json();
    
    if (!ip || !content) {
      return new Response(
        JSON.stringify({ error: "IP and content are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const packet = JSON.stringify({
      type: "ChatMessage",
      content: { sender, message: content },
      time: Date.now() / 1000,
    });

    console.log(`Sending UDP packet to ${ip}:${PORT}`, packet);

    try {
      // Deno UDP API
      const sock = Deno.listenDatagram({ port: 0, transport: "udp" });
      const encoder = new TextEncoder();
      await sock.send(encoder.encode(packet), { hostname: ip, port: PORT });
      sock.close();
      
      console.log(`UDP packet sent successfully to ${ip}:${PORT}`);
      
      return new Response(
        JSON.stringify({ success: true, sent_to: `${ip}:${PORT}` }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (udpError) {
      console.error("UDP send error:", udpError);
      return new Response(
        JSON.stringify({ error: `Failed to send UDP packet: ${udpError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
