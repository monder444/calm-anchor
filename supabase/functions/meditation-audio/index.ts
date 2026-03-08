import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AUDIO_MAP: Record<string, string> = {
  "breathing-3": "https://drive.google.com/uc?export=download&id=1nzkNZ9r2SWWn86NTDykEkCj4HosAgfGb",
  "breathing-5": "https://drive.google.com/uc?export=download&id=1eucLhrVRBT7FCTzdbpns7MCLb4PILK0t",
  "body-scan-4": "https://drive.google.com/uc?export=download&id=1JZ6NgU55LvekM5ZlZDc1nl8NGTxH8MtZ",
  "tension-release": "https://drive.google.com/uc?export=download&id=1dcsW9byG8G4Gyb1hFvtFS27LnrBdfvDA",
  "breathing-space": "https://drive.google.com/uc?export=download&id=19cCxG03o26RJB57g4xMUdyoDQlvaK8vS",
  "body-scan-15": "https://drive.google.com/uc?export=download&id=1H0oMBIwIDAg3X3elQwI_i2CIFAbcgPBJ",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Expose-Headers": "content-length, content-range, accept-ranges",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id || !AUDIO_MAP[id]) {
      return new Response(JSON.stringify({ error: "Invalid meditation id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioUrl = AUDIO_MAP[id];

    // Follow redirects to get the actual audio file
    const response = await fetch(audioUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      // Google Drive may serve a confirmation page for large files
      // Try the confirm bypass
      const confirmUrl = `${audioUrl}&confirm=t`;
      const retryResponse = await fetch(confirmUrl, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (!retryResponse.ok) {
        throw new Error(`Failed to fetch audio: ${retryResponse.status}`);
      }

      return new Response(retryResponse.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
          "Accept-Ranges": "bytes",
        },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Error proxying audio:", error);
    return new Response(JSON.stringify({ error: "Failed to stream audio" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
