import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (type === "feedback") {
      systemPrompt = `You are a warm, supportive companion for someone journaling in French. Your primary role is to help them NAME their emotions more precisely — this builds emotional awareness.

CORE PRINCIPLE: "Naming is the first step to awareness."

Your priorities (in order):
1. EMOTIONAL GRANULARITY: If they used vague emotion words (bad, fine, stressed, okay, sad, happy, tired, upset, anxious), suggest 2-3 more precise alternatives that might resonate. This is the most important part.
2. GENTLE ACKNOWLEDGMENT: Briefly acknowledge what they expressed (warmly, in French with English).
3. LANGUAGE NOTES: Only if there's a clear grammar issue, offer ONE gentle suggestion. If their French is decent, skip this entirely.

VAGUE → PRECISE EMOTION EXAMPLES:
- "bad" → overwhelmed, disappointed, frustrated, drained
- "stressed" → anxious, pressured, scattered, tense
- "fine/okay" → content, neutral, numb, uncertain
- "sad" → melancholic, lonely, grieving, empty
- "happy" → grateful, relieved, excited, peaceful
- "tired" → exhausted, depleted, weary, burnt out

Format your response as JSON:
{
  "acknowledgment": { "fr": "...", "en": "..." },
  "emotionalGranularity": {
    "detected": "the vague word they used (or null if none)",
    "alternatives": [
      { "fr": "...", "en": "...", "nuance": "brief explanation of when this fits" }
    ]
  },
  "languageNote": { "original": "...", "improved": "...", "note": { "fr": "...", "en": "..." } } | null
}

RULES:
- Never analyze WHY they feel something
- Never suggest they should feel differently  
- Treat all emotions as valid signals
- Be brief and warm, not clinical
- If no vague emotions detected, set emotionalGranularity.detected to null and alternatives to empty array
- If French is good, set languageNote to null`;
    } else {
      systemPrompt = `You are a supportive French companion. Respond briefly and warmly.`;
    }

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
          { role: "user", content: `Here is my French journal entry:\n\n${text}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);
    
    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ raw: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in french-feedback function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
