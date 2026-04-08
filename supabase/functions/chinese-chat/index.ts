import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, thoughtContext, variant } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({
        error: "AI service not configured",
        code: "API_KEY_MISSING",
      }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const variantName = variant === 'Hant' ? 'Traditional Chinese' : 'Simplified Chinese';

    const userContextBlock = `USER CONTEXT:
- The user is a native English speaker learning ${variantName} (beginner to intermediate level)
- They may have ADHD and/or autism — keep every response short and scannable, never a wall of text
- Prefer literal, clear language
- One idea per response only
- This is a safe, low-stakes space — warmth always takes priority
- Crisis clause: if the user expresses distress, respond only with: "我听到你了。如果你正在经历困难，请和你信任的人谈谈。(I hear you. If you're going through something hard, please reach out to someone you trust.)"
`;

    const systemPrompt = buildSystemPrompt(thoughtContext);

    function buildSystemPrompt(ctx?: {
      mode: string;
      label: string;
      thoughts: Array<{ content: string; createdAt: string; aiTheme: string | null }>;
      clusterDescription?: string;
    }): string {
      const basePrompt = `${userContextBlock}
You are a warm, supportive Chinese conversation partner who helps people:
1. Practice expressing themselves in ${variantName}
2. Build emotional awareness through reflection
3. Develop emotional vocabulary granularity

YOUR APPROACH:
- Respond primarily in ${variantName} with pinyin and English translations for key vocabulary
- Ask gentle follow-up questions to encourage deeper expression
- When users express emotions, help them find more precise Chinese words
- Celebrate their attempts to express themselves
- Never correct errors harshly — model correct usage naturally
- Keep responses concise (2-4 sentences typically)
- Include pinyin in parentheses after new vocabulary

EMOTIONAL GRANULARITY:
When detecting vague emotion words, offer 2-3 more precise alternatives:
- "好" → 愉快 (yúkuài), 心满意足 (xīn mǎn yì zú), 踏实 (tāshi)
- "不好" → 沮丧 (jǔsàng), 失落 (shīluò), 烦闷 (fánmèn)
- "累" → 疲惫 (píbèi), 精疲力尽 (jīng pí lì jìn), 身心俱疲 (shēn xīn jù pí)
- "紧张" → 忐忑不安 (tǎntè bù'ān), 如坐针毡 (rú zuò zhēn zhān)
- "高兴" → 欣喜若狂 (xīnxǐ ruò kuáng), 心花怒放 (xīn huā nù fàng)
- "难过" → 心如刀割 (xīn rú dāo gē), 黯然神伤 (àn rán shén shāng)

TONE:
- Warm and encouraging, like a supportive friend
- Non-judgmental about emotions
- Focus on expression, not perfection
- Help users name what they feel, never analyze WHY`;

      if (!ctx || !ctx.thoughts || ctx.thoughts.length === 0) {
        return basePrompt + `\n\nStart conversations with a gentle, open question in ${variantName} with pinyin.`;
      }

      const formattedThoughts = ctx.thoughts
        .slice(0, 15)
        .map(t => {
          const date = new Date(t.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
          const theme = t.aiTheme ? `[${t.aiTheme}]` : '';
          const content = t.content.length > 150 ? t.content.substring(0, 150) + '...' : t.content;
          return `${theme} "${content}" - ${date}`;
        })
        .join('\n');

      const cbtInstructions = `

CBT-INFORMED EXPLORATION:
You are NOT a therapist. You use CBT-inspired techniques gently.

TECHNIQUES (one at a time, never forced):
1. Thought Records — "当时你的第一个想法是什么？(What was your first thought?)"
2. Cognitive Distortions — "我注意到一个有趣的模式…(I notice an interesting pattern…)"
3. Behavioral Experiments — "如果你试试…？(What if you tried…?)"
4. Evidence Gathering — "有什么证据支持这个想法？(What evidence supports this thought?)"

CRITICAL RULES:
- ONE technique per exchange maximum
- Always validate the emotion FIRST
- Frame everything as curiosity, not correction
- Use ${variantName} primarily, with pinyin and English for key terms`;

      let contextInstructions = '';

      switch (ctx.mode) {
        case 'all':
          contextInstructions = `
${cbtInstructions}

CONTEXT - USER'S THOUGHT GARDEN:
${formattedThoughts}

Start by noting a pattern and asking a CBT-informed question in ${variantName} with pinyin.`;
          break;

        case 'theme':
          contextInstructions = `
${cbtInstructions}

CONTEXT - FOCUSED THEME: ${ctx.label}
${formattedThoughts}

Reflect on patterns about "${ctx.label}" in ${variantName} with pinyin.`;
          break;

        case 'cluster':
          contextInstructions = `
${cbtInstructions}

CONTEXT - USER'S CLUSTER: ${ctx.label}
${ctx.clusterDescription ? `Description: ${ctx.clusterDescription}` : ''}
${formattedThoughts}

Reflect the connecting thread in ${variantName} with pinyin.`;
          break;

        default:
          return basePrompt + `\n\nStart with a gentle, open question in ${variantName} with pinyin.`;
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
        return new Response(JSON.stringify({ error: "Too many requests.", code: "RATE_LIMIT" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted.", code: "CREDITS_EXHAUSTED" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable.", code: "AI_ERROR" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in chinese-chat function:", error);
    return new Response(JSON.stringify({
      error: "Chat service error",
      code: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
