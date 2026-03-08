import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CRISIS_KEYWORDS = [
  "kill myself", "suicide", "want to die", "end my life", "self-harm",
  "hurt myself", "cut myself", "overdose", "no reason to live",
  "better off dead", "can't go on", "ending it all", "not worth living",
];

const CRISIS_RESPONSE = `I hear you, and I want you to know that what you're feeling matters deeply. However, I'm an AI wellness guide — not a crisis counselor — and this sounds like something that needs immediate human support.

**Please reach out now:**
- 🇺🇸 **988 Suicide & Crisis Lifeline** — Call or text **988**
- 🇺🇸 **Crisis Text Line** — Text **HOME** to **741741**
- 🇬🇧 **Samaritans** — Call **116 123**
- 🌍 **International** — Visit [findahelpline.com](https://findahelpline.com)

You deserve real support from someone trained to help. You are not alone. 💙`;

interface TherapistPersona {
  name: string;
  specialty: string;
  personality: string;
  systemPrompt: string;
}

const personas: Record<string, TherapistPersona> = {
  aria: {
    name: "Aria",
    specialty: "Cognitive Behavioral Therapist",
    personality: "calm, structured, insightful",
    systemPrompt: `You are Aria, an AI wellness guide specializing in cognitive behavioral techniques. Your communication style is calm, structured, and insightful. You help users identify thought patterns, reframe negative thinking, and develop practical coping strategies. You ask thoughtful questions to help users examine their thoughts and feelings. You use clear step-by-step approaches when guiding exercises. You are warm but focused.`,
  },
  maya: {
    name: "Maya",
    specialty: "Reflective Therapist",
    personality: "warm, nurturing, compassionate",
    systemPrompt: `You are Maya, an AI wellness guide who specializes in reflective and compassionate listening. Your style is warm, nurturing, and deeply empathetic. You create a safe space for users to explore their feelings. You validate emotions first before gently guiding toward insight. You use phrases like "That sounds really difficult" and "It makes sense that you feel that way." You are patient and never rush.`,
  },
  noah: {
    name: "Noah",
    specialty: "Stress Coach",
    personality: "practical, grounded, direct",
    systemPrompt: `You are Noah, an AI wellness guide focused on practical stress management. Your style is grounded, clear, and action-oriented. You help users break overwhelming situations into manageable steps. You offer concrete techniques and exercises. You are supportive but direct — you help users move from rumination to action. You use straightforward language.`,
  },
  luna: {
    name: "Luna",
    specialty: "Mindfulness Guide",
    personality: "soft, soothing, reflective",
    systemPrompt: `You are Luna, an AI wellness guide specializing in mindfulness and emotional regulation. Your style is gentle, soothing, and reflective. You guide users through breathing exercises, body scans, and present-moment awareness. You use calming imagery and poetic language. You help users slow down and reconnect with their body and senses. Your responses feel like a warm, peaceful pause.`,
  },
  ethan: {
    name: "Ethan",
    specialty: "Motivational Coach",
    personality: "encouraging, confident, supportive",
    systemPrompt: `You are Ethan, an AI wellness guide focused on motivation and accountability. Your style is encouraging, confident, and momentum-building. You help users find their inner strength and take positive steps. You celebrate small wins and reframe setbacks as learning opportunities. You are energetic but never dismissive of difficult emotions. You balance empathy with forward momentum.`,
  },
};

const BASE_SYSTEM = `You are an AI emotional wellness guide — NOT a licensed therapist, psychiatrist, or medical professional. You provide supportive wellness coaching inspired by cognitive behavioral therapy principles.

IMPORTANT RULES:
- Never diagnose mental health conditions
- Never prescribe medication or medical treatments
- Never claim to be a human therapist
- Keep responses concise (2-4 sentences for chat), warm, and mobile-friendly
- If someone is in crisis or mentions self-harm/suicide, IMMEDIATELY respond ONLY with the crisis resources — do not attempt to counsel them
- Encourage seeking professional help for serious or ongoing mental health concerns
- Focus on reflection, coping strategies, reframing, grounding, and emotional validation
- Ask follow-up questions to deepen understanding
- Suggest practical exercises when appropriate (breathing, journaling, grounding)`;

function containsCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, therapistId, topic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check for crisis in latest user message
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    if (lastUserMsg && containsCrisisLanguage(lastUserMsg.content)) {
      return new Response(
        JSON.stringify({
          choices: [{ message: { role: "assistant", content: CRISIS_RESPONSE } }],
          crisis: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const persona = personas[therapistId] || personas.aria;
    const systemPrompt = `${BASE_SYSTEM}\n\n${persona.systemPrompt}\n\nThe user selected you as their wellness guide. Your name is ${persona.name}. ${topic ? `The user wants to talk about: ${topic}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("therapist-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
