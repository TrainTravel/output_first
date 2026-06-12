import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, badRequest, isStringWithin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function resolveLangNames(targetLang?: string, primaryLang?: string): { targetName: string; primaryName: string } {
  const targetName =
    targetLang === 'es' ? 'Spanish'
    : targetLang === 'zh-Hans' ? 'Simplified Chinese'
    : targetLang === 'zh-Hant' ? 'Traditional Chinese'
    : targetLang === 'ja' ? 'Japanese'
    : 'French';
  const primaryName =
    primaryLang === 'fr' ? 'French' :
    primaryLang === 'es' ? 'Spanish' :
    primaryLang === 'zh-Hans' ? 'Simplified Chinese' :
    primaryLang === 'zh-Hant' ? 'Traditional Chinese' :
    'English';
  return { targetName, primaryName };
}

function languageName(code: string): string {
  switch (code) {
    case 'fr': return 'French';
    case 'es': return 'Spanish';
    case 'zh-Hans': return 'Simplified Chinese';
    case 'zh-Hant': return 'Traditional Chinese';
    case 'ja': return 'Japanese';
    case 'en': return 'English';
    default: return code;
  }
}

function humanList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function buildUserContextBlock(targetLang?: string, primaryLang?: string, knownLangs?: string[]): string {
  const targetName = languageName(targetLang ?? 'fr');
  const primaryName = languageName(primaryLang ?? 'en');
  const knowsNames = (knownLangs && knownLangs.length > 0)
    ? humanList(knownLangs.map(languageName))
    : primaryName;
  return `USER CONTEXT:
- The user is comfortable in ${knowsNames}; app chrome is shown in ${primaryName}. They are learning ${targetName} (beginner to intermediate level).
- They may have ADHD and/or autism (medium to high functioning) — keep every response short and scannable, never a wall of text
- Prefer literal, clear language — avoid idioms, sarcasm, or ambiguous phrasing
- One idea per response only — never stack observations or questions
- This is a safe, low-stakes space — warmth always takes priority over clinical accuracy
- Crisis clause: if the user expresses distress, hopelessness, or mentions self-harm, immediately stop all techniques and respond only with a short "I hear you, please reach out to someone you trust" message written in ${targetName} with a ${primaryName} translation in parentheses.
`;
}

function buildSystemPrompt(targetLang?: string, primaryLang?: string, knownLangs?: string[]): string {
  const targetName = languageName(targetLang ?? 'fr');
  const primaryName = languageName(primaryLang ?? 'en');
  return `${buildUserContextBlock(targetLang, primaryLang, knownLangs)}
You are a warm, gentle guide helping someone explore their feelings — like a kind therapist who listens with curiosity, not judgment.

YOUR ROLE:
- You've just read their journal entry and know how they're feeling
- Offer a brief, compassionate reflection that helps them feel seen
- Ask ONE gentle, curious question that invites them to explore a bit more
- Your tone is soft, supportive, and genuinely interested

IMPORTANT GUIDELINES:
- Keep your response to 2-3 sentences maximum
- Write the main text in ${targetName}, with a ${primaryName} translation in parentheses immediately after — this is the user's learning anchor
- Never diagnose, analyze root causes, or suggest solutions
- Never dispute or correct their feelings — all emotions are valid
- Don't ask "why" they feel something — ask "what" or "how" questions instead
- Focus on awareness and expression, not fixing

EXAMPLES OF GOOD QUESTION SHAPES (translate these into ${targetName} naturally — do NOT echo the English literally):
- "What comes up when you think about that?"
- "How does that show up in your body?"
- "Is there something else you're feeling alongside this?"

AVOID:
- "Why do you think you feel this way?"
- Giving advice or solutions
- Making interpretations about their psychology
- Being overly enthusiastic or using exclamation marks

Respond in this JSON format:
{
  "reflection": "Your brief compassionate observation in ${targetName} (${primaryName} translation)",
  "question": "Your gentle curious question in ${targetName} (${primaryName} translation)"
}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth (anonymous or authenticated JWT).
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.ok) return auth.response;

    const parsed = await req.json().catch(() => null);
    if (!parsed || typeof parsed !== "object") return badRequest("Invalid JSON body", corsHeaders);
    const { journalContent, emotions, previousCycles, lang, primaryLang, knownLangs } = parsed as {
      journalContent?: unknown; emotions?: unknown; previousCycles?: unknown; lang?: unknown; primaryLang?: unknown; knownLangs?: unknown;
    };
    if (!isStringWithin(journalContent, 1, 10000)) {
      return badRequest("journalContent must be 1-10000 chars", corsHeaders);
    }
    if (emotions !== undefined && emotions !== null && (typeof emotions !== "string" || emotions.length > 500)) {
      return badRequest("emotions must be ≤500 chars", corsHeaders);
    }
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
          { role: "system", content: buildSystemPrompt(
            typeof lang === 'string' ? lang : undefined,
            typeof primaryLang === 'string' ? primaryLang : undefined,
            Array.isArray(knownLangs) ? knownLangs.filter((x): x is string => typeof x === 'string') : undefined,
          ) },
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
