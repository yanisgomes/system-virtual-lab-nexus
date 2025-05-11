
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        JSON.stringify({ error: "Missing required fields: ip and content" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Sending UDP to ${ip}:${PORT} with content: ${content}`);

    const packet = JSON.stringify({
      type: "ChatMessage",
      content: { sender, message: content },
      time: Date.now() / 1000,
    });

    // Deno UDP API
    const sock = Deno.listenDatagram({ port: 0, transport: "udp" });
    const encoder = new TextEncoder();
    await sock.send(encoder.encode(packet), { hostname: ip, port: PORT });
    sock.close();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `UDP sent to ${ip}:${PORT}` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error sending UDP:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
