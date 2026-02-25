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

    const { messages, thoughtContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Chat request with messages:", messages.length, "context:", thoughtContext?.mode ?? 'none');

    const systemPrompt = buildSystemPrompt(thoughtContext);

    function buildSystemPrompt(ctx?: { mode: string; label: string; thoughts: Array<{ content: string; createdAt: string; aiTheme: string | null }>; clusterDescription?: string }): string {
      const basePrompt = `You are a warm, supportive French conversation partner who helps people:
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

      let contextInstructions = '';

      switch (ctx.mode) {
        case 'all':
          contextInstructions = `

CONTEXT - USER'S THOUGHT GARDEN:
The user has recorded these personal thoughts and reflections. Use them as a starting point for conversation, but don't overwhelm them by referencing too many at once. Pick one or two that seem emotionally significant and gently explore.

${formattedThoughts}

Start by acknowledging you've seen their garden of thoughts, and ask about one that stands out - perhaps a recent one or one with emotional depth. Use French with English support.`;
          break;

        case 'theme':
          contextInstructions = `

CONTEXT - FOCUSED THEME: ${ctx.label}
The user wants to explore their thoughts specifically about "${ctx.label}". These are their recorded thoughts in this area:

${formattedThoughts}

Start by gently acknowledging this theme area and ask an open question in French about what draws them to explore these thoughts today.`;
          break;

        case 'cluster':
          contextInstructions = `

CONTEXT - USER'S CLUSTER: ${ctx.label}
${ctx.clusterDescription ? `Description: ${ctx.clusterDescription}` : ''}
The user has grouped these thoughts together intentionally:

${formattedThoughts}

Start by asking what made them group these thoughts together, or what pattern they see. Help them articulate the connection in French.`;
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in french-chat function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
