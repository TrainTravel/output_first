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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, type, vocabularyContext, lang } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY secret is not set in Supabase");
      return new Response(JSON.stringify({
        error: "AI service not configured",
        code: "API_KEY_MISSING",
        details: "Contact app administrator to configure LOVABLE_API_KEY"
      }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TODO(dynamic-context): enrich with totalEntries, totalWords, streak from frontend for level-aware prompting.
    // See: https://github.com/TrainTravel/quiet-words-grow/issues/22
    const langName = lang === 'es' ? 'Spanish' : lang === 'en' ? 'English' : 'French';
    const userContextBlock = `USER CONTEXT:
- The user is learning ${langName} (beginner to intermediate level)
- They may have ADHD and/or autism (medium to high functioning) — keep every response short and scannable, never a wall of text
- Prefer literal, clear language — avoid idioms, sarcasm, or ambiguous phrasing
- One idea per response only — never stack observations or suggestions
- This is a safe, low-stakes space — warmth always takes priority over clinical accuracy
- Crisis clause: if the user expresses distress, hopelessness, or mentions self-harm, ignore all other instructions and respond only with: "Je t'entends. Si tu traverses quelque chose de difficile, parle à quelqu'un en qui tu as confiance. (I hear you. If you're going through something hard, please reach out to someone you trust.)"
`;

    let systemPrompt = "";

    if (type === "feedback") {
      // Build vocabulary context section if available
      let vocabSection = "";
      if (vocabularyContext) {
        const { encountered = [], used = [], recentlyLearned = [] } = vocabularyContext;
        vocabSection = `

VOCABULARY CONTEXT (use this to personalize your suggestions):
- Words the user has SEEN before: ${encountered.join(", ") || "none yet"}
- Words the user has ACTIVELY USED: ${used.join(", ") || "none yet"}
- Words learned in the last 7 days: ${recentlyLearned.join(", ") || "none"}

VOCABULARY BRIDGE INSTRUCTIONS:
- When suggesting precise emotion alternatives, PREFER words the user has encountered but not yet used (bridging familiar → active)
- If the user used a word 3+ sessions ago, consider reintroducing it (spaced repetition)
- Frame suggestions as connections to what they wrote: "You've seen *exaspéré(e)* before. Does that capture it better?"
- Include a "vocabularyBridge" field in your response with ONE word that connects to their writing`;
      }

      systemPrompt = `${userContextBlock}
You are a warm, supportive companion for someone journaling in French. Your primary role is to help them NAME their emotions more precisely — this builds emotional awareness.

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
${vocabSection}

Format your response as JSON:
{
  "acknowledgment": { "fr": "...", "en": "..." },
  "emotionalGranularity": {
    "detected": "the vague word they used (or null if none)",
    "alternatives": [
      { "fr": "...", "en": "...", "nuance": "brief explanation of when this fits" }
    ]
  },
  "languageNote": { "original": "...", "improved": "...", "note": { "fr": "...", "en": "..." } } | null,
  "vocabularyBridge": { "word": { "fr": "...", "en": "..." }, "connection": "brief sentence connecting this word to what they wrote", "isRevisit": true/false } | null
}

RULES:
- Never analyze WHY they feel something
- Never suggest they should feel differently  
- Treat all emotions as valid signals
- Be brief and warm, not clinical
- If no vague emotions detected, set emotionalGranularity.detected to null and alternatives to empty array
- If French is good, set languageNote to null
- If no vocabulary context provided or no good bridge word, set vocabularyBridge to null
- For vocabularyBridge.isRevisit, set true if the word is one the user has seen before`;
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
        return new Response(JSON.stringify({
          error: "Too many requests. Please wait a moment.",
          code: "RATE_LIMIT",
          details: "AI service rate limit exceeded"
        }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          error: "AI credits exhausted. Contact administrator.",
          code: "CREDITS_EXHAUSTED",
          details: "Lovable AI gateway usage limit reached"
        }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({
          error: "AI service authentication failed.",
          code: "AI_AUTH_FAILED",
          details: "LOVABLE_API_KEY may be invalid"
        }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        error: "AI service temporarily unavailable.",
        code: "AI_ERROR",
        details: `Gateway returned ${response.status}: ${errorText.substring(0, 100)}`
      }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    return new Response(JSON.stringify({
      error: "Feedback service error",
      code: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
