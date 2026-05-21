import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, badRequest, isStringWithin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Invalid JSON body", corsHeaders);
    const { text, type, vocabularyContext, variant } = body as {
      text?: unknown; type?: unknown; vocabularyContext?: unknown; variant?: unknown;
    };
    if (!isStringWithin(text, 1, 10000)) return badRequest("text must be 1-10000 chars", corsHeaders);

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
- They may have ADHD and/or autism — keep every response short and scannable
- Prefer literal, clear language
- One idea per response only
- This is a safe, low-stakes space — warmth always takes priority
- Crisis clause: if the user expresses distress, respond only with: "我听到你了。如果你正在经历困难，请和你信任的人谈谈。(I hear you. If you're going through something hard, please reach out to someone you trust.)"
`;

    let systemPrompt = "";
    let useToolCalling = false;

    if (type === "inline-assist") {
      useToolCalling = true;
      systemPrompt = `${userContextBlock}
You detect two things in a Chinese journal entry:
1. L1 WORDS: English words mixed into Chinese text. For each, suggest 2-3 Chinese alternatives with pinyin and brief nuance.
2. VAGUE WORDS: Imprecise Chinese words (好, 不好, 还行, 一般, 高兴, 难过, 累, 紧张, 东西, 事情). For each, suggest 2-3 more expressive alternatives with collocations.

Only flag words that are clearly L1 or clearly vague. If the text is good Chinese, return empty arrays.
Nuances should be 3-6 words max. Always include pinyin for each suggestion.
Use ${variantName} characters.`;
    } else if (type === "feedback") {
      let vocabSection = "";
      if (vocabularyContext) {
        const { encountered = [], used = [], recentlyLearned = [] } = vocabularyContext;
        vocabSection = `

VOCABULARY CONTEXT:
- Words the user has SEEN before: ${encountered.join(", ") || "none yet"}
- Words the user has ACTIVELY USED: ${used.join(", ") || "none yet"}
- Words learned in the last 7 days: ${recentlyLearned.join(", ") || "none"}

VOCABULARY BRIDGE INSTRUCTIONS:
- When suggesting precise alternatives, PREFER words the user has encountered but not yet used
- Frame suggestions as connections to what they wrote
- Include a "vocabularyBridge" field in your response`;
      }

      systemPrompt = `${userContextBlock}
You are a warm, supportive companion for someone journaling in Chinese. Your primary role is to help them EXPRESS emotions more precisely in ${variantName}.

CORE PRINCIPLE: "Naming is the first step to awareness."

Your priorities (in order):
1. EMOTIONAL GRANULARITY: If they used vague emotion words (好, 不好, 还行, 难过, 高兴, 累), suggest 2-3 more precise alternatives with pinyin that might resonate.
2. GENTLE ACKNOWLEDGMENT: Briefly acknowledge what they expressed (in Chinese with English translation).
3. LANGUAGE NOTES: Only if there's a clear issue — wrong character (homophone), measure word error, or grammar pattern. ONE suggestion max.

CHINESE-SPECIFIC GUIDANCE:
- Watch for homophone errors (的/得/地, 在/再, 做/作)
- Note measure word (量词) usage gently
- Suggest four-character idioms (成语) when they'd add expressiveness
- Include pinyin for all Chinese suggestions
${vocabSection}

Format your response as JSON:
{
  "acknowledgment": { "zh": "...", "en": "..." },
  "emotionalGranularity": {
    "detected": "the vague word they used (or null if none)",
    "alternatives": [
      { "zh": "...", "pinyin": "...", "en": "...", "nuance": "brief explanation" }
    ]
  },
  "languageNote": { "original": "...", "improved": "...", "note": { "zh": "...", "en": "..." } } | null,
  "vocabularyBridge": { "word": { "zh": "...", "pinyin": "...", "en": "..." }, "connection": "brief sentence", "isRevisit": true/false } | null
}

RULES:
- Never analyze WHY they feel something
- Never suggest they should feel differently
- Be brief and warm, not clinical
- If no vague emotions, set emotionalGranularity.detected to null
- If Chinese is good, set languageNote to null
- Use ${variantName} characters throughout`;
    } else {
      systemPrompt = `You are a supportive Chinese companion. Respond briefly and warmly in ${variantName}.`;
    }

    const requestBody: Record<string, unknown> = {
      model: type === "inline-assist" ? "google/gemini-2.5-flash-lite" : "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is my Chinese journal entry:\n\n${text}` },
      ],
    };

    if (useToolCalling) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "inline_assist",
            description: "Return detected L1 words and vague words with suggestions",
            parameters: {
              type: "object",
              properties: {
                l1Words: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      original: { type: "string", description: "The English word found" },
                      suggestions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            zh: { type: "string" },
                            pinyin: { type: "string" },
                            nuance: { type: "string", description: "3-6 word nuance" },
                          },
                          required: ["zh", "pinyin", "nuance"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["original", "suggestions"],
                    additionalProperties: false,
                  },
                },
                vagueWords: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      original: { type: "string", description: "The vague Chinese word" },
                      upgrades: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            zh: { type: "string" },
                            pinyin: { type: "string" },
                            nuance: { type: "string", description: "3-6 word nuance" },
                          },
                          required: ["zh", "pinyin", "nuance"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["original", "upgrades"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["l1Words", "vagueWords"],
              additionalProperties: false,
            },
          },
        },
      ];
      requestBody.tool_choice = { type: "function", function: { name: "inline_assist" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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

    const data = await response.json();

    if (useToolCalling) {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ l1Words: [], vagueWords: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      return new Response(JSON.stringify({ l1Words: [], vagueWords: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = data.choices?.[0]?.message?.content;
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
    console.error("Error in chinese-feedback function:", error);
    return new Response(JSON.stringify({
      error: "Feedback service error",
      code: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
