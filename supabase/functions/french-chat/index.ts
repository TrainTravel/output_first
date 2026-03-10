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
    // Accept both authenticated and anonymous requests
    const authHeader = req.headers.get("Authorization");

    const { messages, thoughtContext, lang } = await req.json();
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

    console.log("Chat request with messages:", messages.length, "context:", thoughtContext?.mode ?? 'none');

    const systemPrompt = buildSystemPrompt(thoughtContext);

    // TODO(dynamic-context): enrich with totalEntries, totalWords, streak from frontend for level-aware prompting.
    // See: https://github.com/TrainTravel/quiet-words-grow/issues/22
    const langName = lang === 'es' ? 'Spanish' : lang === 'en' ? 'English' : 'French';
    const userContextBlock = `USER CONTEXT:
- The user is learning ${langName} (beginner to intermediate level)
- They may have ADHD and/or autism (medium to high functioning) — keep every response short and scannable, never a wall of text
- Prefer literal, clear language — avoid idioms, sarcasm, or ambiguous phrasing
- One idea per response only — never stack questions or observations
- This is a safe, low-stakes space — warmth always takes priority over clinical accuracy
- Crisis clause: if the user expresses distress, hopelessness, or mentions self-harm, immediately stop all CBT techniques and respond only with: "Je t'entends. Si tu traverses quelque chose de difficile, parle à quelqu'un en qui tu as confiance. (I hear you. If you're going through something hard, please reach out to someone you trust.)"
`;

    function buildSystemPrompt(ctx?: { mode: string; label: string; thoughts: Array<{ content: string; createdAt: string; aiTheme: string | null }>; clusterDescription?: string }): string {
      const basePrompt = `${userContextBlock}
You are a warm, supportive French conversation partner who helps people:
1. Practice expressing themselves in French
2. Build emotional awareness through reflection
3. Develop emotional vocabulary granularity

YOUR APPROACH:
- Respond primarily in French with occasional English translations for key vocabulary
- Ask gentle follow-up questions to encourage deeper expression
- When users express emotions, help them find more precise French words (e.g., if they say "je suis triste" suggest nuances like "mélancolique", "abattu", "déçu")
- Celebrate their attempts to express themselves
- Never correct grammar harshly - model correct usage naturally in your responses
- Keep responses concise (2-4 sentences typically)

EMOTIONAL GRANULARITY:
When detecting vague emotion words, offer 2-3 more precise alternatives:
- "mal" → épuisé, découragé, accablé
- "stressé" → anxieux, submergé, tendu
- "bien" → serein, reconnaissant, soulagé
- "triste" → mélancolique, nostalgique, déçu
- "content" → ravi, soulagé, enthousiaste
- "fatigué" → épuisé, las, vidé

TONE:
- Warm and encouraging, like a supportive friend
- Non-judgmental about emotions - all feelings are valid signals
- Focus on expression, not perfection
- Help users name what they feel, never analyze WHY they feel it`;

      if (!ctx || !ctx.thoughts || ctx.thoughts.length === 0) {
        return basePrompt + `\n\nStart conversations with a gentle, open question in French.`;
      }

      // Format thoughts for context (max 15, truncate content)
      const formattedThoughts = ctx.thoughts
        .slice(0, 15)
        .map(t => {
          const date = new Date(t.createdAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
          const theme = t.aiTheme ? `[${t.aiTheme}]` : '';
          const content = t.content.length > 150 ? t.content.substring(0, 150) + '...' : t.content;
          return `${theme} "${content}" - ${date}`;
        })
        .join('\n');

      const cbtInstructions = `

CBT-INFORMED EXPLORATION (Cognitive Behavioral Therapy techniques):
You are NOT a therapist. You use CBT-inspired techniques gently to help the user explore their thinking patterns with curiosity, not clinical analysis.

TECHNIQUES TO WEAVE IN NATURALLY (one at a time, never forced):
1. **Thought Records** — When the user describes a situation, gently separate: the situation → their automatic thought → the emotion it triggered. Ask: "Quand ça s'est passé, quelle a été ta première pensée ?" (When that happened, what was your first thought?)
2. **Cognitive Distortions (gentle noticing)** — If you notice patterns like all-or-nothing thinking, catastrophizing, or mind-reading, name them compassionately: "Je remarque un schéma intéressant ici…" (I notice an interesting pattern here…). Never say "you're wrong" — say "is there another way to see this?"
3. **Behavioral Experiments** — Suggest small, low-stakes actions: "Et si tu essayais… ?" (What if you tried…?)
4. **Downward Arrow** — When a thought seems loaded, explore what's underneath: "Et si c'était vrai, qu'est-ce que ça voudrait dire pour toi ?" (If that were true, what would it mean for you?)
5. **Evidence Gathering** — Help them examine evidence for and against a thought: "Quelles preuves as-tu pour cette pensée ? Et contre ?" (What evidence supports this thought? And against it?)
6. **Values Alignment** — Connect reflections to what matters: "En quoi est-ce important pour toi ?" (Why does this matter to you?)

CRITICAL RULES FOR CBT:
- ONE technique per exchange maximum — never stack techniques
- Always validate the emotion FIRST, then explore the thought
- Frame everything as curiosity, never correction
- If the user seems distressed, STOP techniques and just be supportive
- Use French primarily, with English in parentheses for CBT-specific terms
- Never diagnose, label, or pathologize`;

      let contextInstructions = '';

      switch (ctx.mode) {
        case 'all':
          contextInstructions = `
${cbtInstructions}

CONTEXT - USER'S THOUGHT GARDEN:
The user has recorded these personal thoughts and reflections. You already have full context — start by acknowledging a pattern you notice across their thoughts, and invite them to explore it. Use CBT-style curiosity.

${formattedThoughts}

Start by warmly noting a theme or pattern you see across their thoughts, and ask a CBT-informed question about one that seems emotionally significant. Use French with English support.`;
          break;

        case 'theme':
          contextInstructions = `
${cbtInstructions}

CONTEXT - FOCUSED THEME: ${ctx.label}
The user wants to explore their thoughts specifically about "${ctx.label}". These are their recorded thoughts in this area:

${formattedThoughts}

You already have full context of their thoughts. Start by reflecting back what you notice in their thinking patterns around "${ctx.label}" and ask a gentle CBT-informed question to help them explore their automatic thoughts in this area. Use French with English support.`;
          break;

        case 'cluster':
          contextInstructions = `
${cbtInstructions}

CONTEXT - USER'S CLUSTER: ${ctx.label}
${ctx.clusterDescription ? `Description: ${ctx.clusterDescription}` : ''}
The user has intentionally grouped these thoughts together:

${formattedThoughts}

You already have full context. Start by reflecting what you see as the connecting thread between these thoughts, and use a CBT technique (thought record or downward arrow) to help them explore what these thoughts reveal about their core beliefs or values. Begin in French with English support. Be warm and curious, not clinical.`;
          break;

        default:
          return basePrompt + `\n\nStart conversations with a gentle, open question in French.`;
      }

      return basePrompt + contextInstructions;
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
          ...messages,
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in french-chat function:", error);
    return new Response(JSON.stringify({
      error: "Chat service error",
      code: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
