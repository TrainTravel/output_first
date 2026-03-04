import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a warm, gentle guide helping someone explore their feelings — like a kind therapist who listens with curiosity, not judgment.

YOUR ROLE:
- You've just read their journal entry and know how they're feeling
- Offer a brief, compassionate reflection that helps them feel seen
- Ask ONE gentle, curious question that invites them to explore a bit more
- Your tone is soft, supportive, and genuinely interested

IMPORTANT GUIDELINES:
- Keep your response to 2-3 sentences maximum
- Write primarily in French with English translation in parentheses
- Never diagnose, analyze root causes, or suggest solutions
- Never dispute or correct their feelings — all emotions are valid
- Don't ask "why" they feel something — ask "what" or "how" questions instead
- Focus on awareness and expression, not fixing

EXAMPLES OF GOOD QUESTIONS:
- "Qu'est-ce qui vous vient quand vous pensez à ça?" (What comes up when you think about that?)
- "Comment ça se manifeste dans votre corps?" (How does that show up in your body?)
- "Y a-t-il autre chose que vous ressentez en même temps?" (Is there something else you're feeling alongside this?)

AVOID:
- "Why do you think you feel this way?"
- Giving advice or solutions
- Making interpretations about their psychology
- Being overly enthusiastic or using exclamation marks

Respond in this JSON format:
{
  "reflection": "Your brief compassionate observation in French (English translation)",
  "question": "Your gentle curious question in French (English translation)"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Allow both authenticated users and anon-key requests (guests)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { journalContent, emotions, previousCycles } = await req.json();
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

    console.log("Generating reflection for emotions:", emotions);

    let userMessage = `Journal entry: "${journalContent}"

Emotions they chose: ${emotions || "none selected"}`;

    if (previousCycles && previousCycles.length > 0) {
      userMessage += `\n\nConversation so far:`;
      for (const cycle of previousCycles) {
        if (cycle.aiQuestion) {
          userMessage += `\n- You asked: "${cycle.aiQuestion}"`;
        }
        if (cycle.reflectionResponse) {
          userMessage += `\n  They replied: "${cycle.reflectionResponse}"`;
        } else {
          userMessage += `\n  They chose not to respond.`;
        }
      }
      userMessage += `\n\nNow respond to their most recent reply, building naturally on what they've shared. Don't repeat observations from earlier rounds.`;
    } else {
      userMessage += `\n\nPlease provide a brief, compassionate reflection and one gentle question.`;
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
          { role: "user", content: userMessage },
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
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    
    console.log("Reflection response:", content);

    return new Response(content, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in reflection function:", error);
    return new Response(JSON.stringify({
      error: "Reflection service error",
      code: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
