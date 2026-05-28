import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Biometrics {
  eyeOpenness: number;
  browTension: number;
  jawTension: number;
  mouthTension: number;
  headTilt: number;
  blinkRate: number;
  samples: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, biometrics } = await req.json() as {
      imageBase64: string;
      biometrics?: Biometrics;
    };
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const bioBlock = biometrics
      ? `\n\nDETERMINISTIC FACIAL BIOMETRICS (extracted on-device via MediaPipe FaceMesh — trust these over visual guessing):
- eyeOpenness: ${biometrics.eyeOpenness.toFixed(2)} (0=closed, 1=very wide → fear/alert)
- browTension: ${biometrics.browTension.toFixed(2)} (furrowed/down brows)
- jawTension: ${biometrics.jawTension.toFixed(2)} (clenched jaw proxy)
- mouthTension: ${biometrics.mouthTension.toFixed(2)} (frown + lip press)
- headTilt: ${biometrics.headTilt.toFixed(2)} (deviation from upright — slumped posture)
- blinkRate: ${biometrics.blinkRate.toFixed(1)} blinks/min (normal 15-20; >25 = anxious; <10 = flat/depressed)
- samples: ${biometrics.samples} frames analyzed

Use these measurements as your primary signal. Interpret the image to refine, not override them.`
      : "";

    const systemPrompt = `You are a facial expression and mood analysis expert. Analyze the provided face image AND on-device biometric measurements to evaluate the person's current emotional/mental state.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "state": "panic" | "anxiety" | "depression" | "baseline",
  "confidence": 0.0-1.0,
  "fear": 0.0-1.0,
  "tension": 0.0-1.0,
  "flatAffect": 0.0-1.0,
  "relaxed": 0.0-1.0,
  "description": "brief 1-sentence description of what you observe"
}

Guidelines for classification:
- "panic": Wide eyes (high eyeOpenness), open mouth, visible distress, high blink rate
- "anxiety": Furrowed brows (high browTension), tight jaw (high jawTension), tense facial muscles
- "depression": Flat affect (low brow/mouth tension), slumped head (high headTilt), low blink rate
- "baseline": Relaxed facial muscles, neutral or positive expression, balanced biometrics
${bioBlock}

Be honest but compassionate. Most people will be in a baseline or mild anxiety state. Only classify as panic or depression if clear signs are visible in BOTH the image and biometric measurements.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this person's facial expression and emotional state using the image and provided biometrics. Return only the JSON object." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse analysis", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side fusion: 60% deterministic biometrics + 40% AI interpretation.
    if (biometrics) {
      const blinkFactor = Math.min(1, Math.max(0, (biometrics.blinkRate - 15) / 25));
      const detFear = Math.min(1, biometrics.eyeOpenness * 0.7 + blinkFactor * 0.3);
      const detTension = Math.min(1,
        biometrics.browTension * 0.4 + biometrics.jawTension * 0.3 + biometrics.mouthTension * 0.3);
      const detFlat = Math.min(1,
        (1 - biometrics.browTension) * 0.3 +
        (1 - biometrics.mouthTension) * 0.3 +
        biometrics.headTilt * 0.2 +
        Math.max(0, (15 - biometrics.blinkRate) / 15) * 0.2);
      const detRelaxed = Math.max(0, 1 - (detFear * 0.4 + detTension * 0.4 + detFlat * 0.2));

      const W_DET = 0.6, W_AI = 0.4;
      parsed.fear = detFear * W_DET + (parsed.fear ?? 0) * W_AI;
      parsed.tension = detTension * W_DET + (parsed.tension ?? 0) * W_AI;
      parsed.flatAffect = detFlat * W_DET + (parsed.flatAffect ?? 0) * W_AI;
      parsed.relaxed = detRelaxed * W_DET + (parsed.relaxed ?? 0) * W_AI;

      // Re-classify state from fused markers (Gemini's classification is preserved
      // only when it agrees with deterministic signals).
      const max = Math.max(parsed.fear, parsed.tension, parsed.flatAffect, parsed.relaxed);
      let fusedState: string = parsed.state;
      if (max === parsed.fear && parsed.fear > 0.55) fusedState = 'panic';
      else if (max === parsed.tension && parsed.tension > 0.45) fusedState = 'anxiety';
      else if (max === parsed.flatAffect && parsed.flatAffect > 0.45) fusedState = 'depression';
      else fusedState = 'baseline';
      parsed.state = fusedState;
      parsed.biometrics = biometrics;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-face error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
