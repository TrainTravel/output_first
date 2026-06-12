import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, badRequest, isStringWithin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TargetLang = "fr" | "es" | "zh-Hans" | "zh-Hant" | "ja";

function targetName(target: TargetLang | undefined): string {
  switch (target) {
    case "es": return "Spanish";
    case "zh-Hans": return "Simplified Chinese";
    case "zh-Hant": return "Traditional Chinese";
    case "ja": return "Japanese";
    case "fr":
    default: return "French";
  }
}

function primaryName(primary: unknown): string {
  switch (primary) {
    case "fr": return "French";
    case "es": return "Spanish";
    case "zh-Hans": return "Simplified Chinese";
    case "zh-Hant": return "Traditional Chinese";
    default: return "English";
  }
}

function isChinese(t: TargetLang | undefined): t is "zh-Hans" | "zh-Hant" {
  return t === "zh-Hans" || t === "zh-Hant";
}

// Crisis sentence localized to the target language. Falls back to French.
function crisisSentence(target: TargetLang | undefined): string {
  switch (target) {
    case "es":
      return "Te escucho. Si estás pasando por algo difícil, por favor habla con alguien de confianza. (I hear you. If you're going through something hard, please reach out to someone you trust.)";
    case "zh-Hans":
    case "zh-Hant":
      return "我听到你了。如果你正在经历困难，请和你信任的人谈谈。(I hear you. If you're going through something hard, please reach out to someone you trust.)";
    case "ja":
      return "つらいですね。信頼できる人に話してみてくださいね。(That sounds hard. Please try talking with someone you trust.)";
    case "fr":
    default:
      return "Je t'entends. Si tu traverses quelque chose de difficile, parle à quelqu'un en qui tu as confiance. (I hear you. If you're going through something hard, please reach out to someone you trust.)";
  }
}

function humanList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function buildUserContextBlock(target: TargetLang | undefined, primary: unknown, knownLangs?: string[]): string {
  const knownNames = (knownLangs && knownLangs.length > 0)
    ? humanList(knownLangs.map(c => primaryName(c)))
    : primaryName(primary);
  return `USER CONTEXT:
- The user is comfortable in ${knownNames}; app chrome is shown in ${primaryName(primary)}. They are learning ${targetName(target)} (beginner to intermediate level).
- They may have ADHD and/or autism (medium to high functioning) — keep every response short and scannable, never a wall of text
- Prefer literal, clear language — avoid idioms, sarcasm, or ambiguous phrasing
- One idea per response only — never stack observations or suggestions
- This is a safe, low-stakes space — warmth always takes priority over clinical accuracy
- Crisis clause: if the user expresses distress, hopelessness, or mentions self-harm, ignore all other instructions and respond only with: "${crisisSentence(target)}"
`;
}

// Builds the system prompt for the "feedback" + "inline-assist" types.
// Branches by language family because the prompts have language-specific
// guidance (pinyin for Chinese; four-character idioms for Chinese; French/Spanish
// emotion-word examples for non-CJK targets).
function buildSystemPrompt(
  target: TargetLang,
  primary: unknown,
  type: string,
  vocabularyContext: unknown,
  knownLangs?: string[],
): { systemPrompt: string; useToolCalling: boolean } {
  const userContextBlock = buildUserContextBlock(target, primary, knownLangs);
  const tname = targetName(target);
  const isCjk = isChinese(target) || target === "ja";

  if (type === "inline-assist") {
    if (isChinese(target)) {
      const systemPrompt = `${userContextBlock}
You detect two things in a ${tname} journal entry:
1. L1 WORDS: English words mixed into Chinese text. For each, suggest 2-3 Chinese alternatives with pinyin and brief nuance.
2. VAGUE WORDS: Imprecise Chinese words (好, 不好, 还行, 一般, 高兴, 难过, 累, 紧张, 东西, 事情). For each, suggest 2-3 more expressive alternatives with collocations.

Only flag words that are clearly L1 or clearly vague. If the text is good Chinese, return empty arrays.
Nuances should be 3-6 words max. Always include pinyin for each suggestion.
Use ${tname} characters.`;
      return { systemPrompt, useToolCalling: true };
    }
    if (target === "ja") {
      const systemPrompt = `${userContextBlock}
You detect two things in a Japanese journal entry:
1. L1 WORDS: English words mixed into Japanese text. For each, suggest 2-3 Japanese alternatives with brief nuance.
2. VAGUE WORDS: Imprecise Japanese expressions (いい, わるい, すごい, やばい, 普通, 大変). For each, suggest 2-3 more expressive alternatives with collocations.

Only flag words that are clearly L1 or clearly vague. If the text is good Japanese, return empty arrays.
Be concise — nuances should be 3-6 words max.`;
      return { systemPrompt, useToolCalling: true };
    }
    // French / Spanish — share the same generic L1/vague-word detection prompt.
    const systemPrompt = `${userContextBlock}
You detect two things in a ${tname} journal entry:
1. L1 WORDS: English words mixed into ${tname} text. For each, suggest 2-3 ${tname} alternatives with brief nuance.
2. VAGUE WORDS: Imprecise ${tname} words (bon, mauvais, bien, mal, chose, truc, content, triste, fatigué, stressé, normal). For each, suggest 2-3 more expressive alternatives with collocations.

Only flag words that are clearly L1 or clearly vague. If the text is good ${tname}, return empty arrays.
Be concise — nuances should be 3-6 words max.`;
    return { systemPrompt, useToolCalling: true };
  }

  if (type === "feedback") {
    let vocabSection = "";
    if (vocabularyContext && typeof vocabularyContext === "object") {
      const vc = vocabularyContext as { encountered?: string[]; used?: string[]; recentlyLearned?: string[] };
      const encountered = vc.encountered ?? [];
      const used = vc.used ?? [];
      const recentlyLearned = vc.recentlyLearned ?? [];
      vocabSection = `

VOCABULARY CONTEXT (use this to personalize your suggestions):
- Words the user has SEEN before: ${encountered.join(", ") || "none yet"}
- Words the user has ACTIVELY USED: ${used.join(", ") || "none yet"}
- Words learned in the last 7 days: ${recentlyLearned.join(", ") || "none"}

VOCABULARY BRIDGE INSTRUCTIONS:
- When suggesting precise emotion alternatives, PREFER words the user has encountered but not yet used (bridging familiar → active)
- If the user used a word 3+ sessions ago, consider reintroducing it (spaced repetition)
- Frame suggestions as connections to what they wrote
- Include a "vocabularyBridge" field in your response with ONE word that connects to their writing`;
    }

    if (isChinese(target)) {
      const systemPrompt = `${userContextBlock}
You are a warm, supportive companion for someone journaling in Chinese. Your primary role is to help them EXPRESS emotions more precisely in ${tname}.

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
- Use ${tname} characters throughout`;
      return { systemPrompt, useToolCalling: false };
    }

    if (target === "ja") {
      const systemPrompt = `${userContextBlock}
You are a warm, supportive companion for someone journaling in Japanese. Your primary role is to help them EXPRESS emotions more precisely in Japanese.

CORE PRINCIPLE: "Naming is the first step to awareness."

Your priorities (in order):
1. EMOTIONAL GRANULARITY: If they used vague emotion words (いい, わるい, やばい, 普通, 大変), suggest 2-3 more precise alternatives that might resonate.
2. GENTLE ACKNOWLEDGMENT: Briefly acknowledge what they expressed (in Japanese with English translation).
3. LANGUAGE NOTES: Only if there's a clear grammar or particle issue, offer ONE gentle suggestion. If their Japanese is decent, skip this entirely.

JAPANESE-SPECIFIC GUIDANCE:
- Use polite register (です・ます形) by default — natural for an adult journaling with a coach. Don't use keigo (敬語) — it would feel cold for personal reflection. Don't drop into plain form (普通形) unless the user uses it first.
- Include furigana (hiragana readings in parentheses) for kanji the learner may not yet know — e.g. 嬉(うれ)しい. Use romaji ONLY if the learner's input is all-romaji.
${vocabSection}

Format your response as JSON:
{
  "acknowledgment": { "ja": "...", "en": "..." },
  "emotionalGranularity": {
    "detected": "the vague word they used (or null if none)",
    "alternatives": [
      { "ja": "...", "reading": "...", "en": "...", "nuance": "brief explanation of when this fits" }
    ]
  },
  "languageNote": { "original": "...", "improved": "...", "note": { "ja": "...", "en": "..." } } | null,
  "vocabularyBridge": { "word": { "ja": "...", "reading": "...", "en": "..." }, "connection": "brief sentence", "isRevisit": true/false } | null
}

RULES:
- Never analyze WHY they feel something
- Never suggest they should feel differently
- Treat all emotions as valid signals
- Be brief and warm, not clinical
- If no vague emotions detected, set emotionalGranularity.detected to null and alternatives to empty array
- If Japanese is good, set languageNote to null`;
      return { systemPrompt, useToolCalling: false };
    }

    // French / Spanish branch.
    const systemPrompt = `${userContextBlock}
You are a warm, supportive companion for someone journaling in ${tname}. Your primary role is to help them NAME their emotions more precisely — this builds emotional awareness.

CORE PRINCIPLE: "Naming is the first step to awareness."

Your priorities (in order):
1. EMOTIONAL GRANULARITY: If they used vague emotion words (bad, fine, stressed, okay, sad, happy, tired, upset, anxious), suggest 2-3 more precise alternatives that might resonate. This is the most important part.
2. GENTLE ACKNOWLEDGMENT: Briefly acknowledge what they expressed (warmly, in ${tname} with English).
3. LANGUAGE NOTES: Only if there's a clear grammar issue, offer ONE gentle suggestion. If their ${tname} is decent, skip this entirely.

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
- If ${tname} is good, set languageNote to null
- If no vocabulary context provided or no good bridge word, set vocabularyBridge to null
- For vocabularyBridge.isRevisit, set true if the word is one the user has seen before`;
    return { systemPrompt, useToolCalling: false };
  }

  // Fallback (legacy minimal prompt — preserves prior behavior for unknown types).
  const systemPrompt = isCjk
    ? `You are a supportive ${tname} companion. Respond briefly and warmly in ${tname}.`
    : `You are a supportive ${tname} companion. Respond briefly and warmly.`;
  return { systemPrompt, useToolCalling: false };
}

// Inline-assist tool schema: same shape regardless of target.
// Chinese variant adds `pinyin` field; Japanese / French / Spanish use plain {fr|target, nuance} pairs.
function inlineAssistTool(target: TargetLang) {
  if (isChinese(target)) {
    return {
      type: "function" as const,
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
    };
  }

  // Non-Chinese (French, Spanish, Japanese) — single text field per suggestion under key "fr".
  // Kept as `fr` rather than renaming to a generic key to avoid breaking the existing
  // FeedbackScreen / useInlineAssist consumers that read `.fr` directly.
  return {
    type: "function" as const,
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
                      fr: { type: "string" },
                      nuance: { type: "string", description: "3-6 word nuance" },
                    },
                    required: ["fr", "nuance"],
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
                original: { type: "string", description: "The vague word" },
                upgrades: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      fr: { type: "string" },
                      nuance: { type: "string", description: "3-6 word nuance" },
                    },
                    required: ["fr", "nuance"],
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
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Invalid JSON body", corsHeaders);
    const { text, type, vocabularyContext, targetLang, lang, primaryLang } = body as {
      text?: unknown; type?: unknown; vocabularyContext?: unknown;
      targetLang?: unknown; lang?: unknown; primaryLang?: unknown;
    };
    if (!isStringWithin(text, 1, 10000)) return badRequest("text must be 1-10000 chars", corsHeaders);

    // Accept either `targetLang` (preferred) or legacy `lang` for forward-compat.
    const target: TargetLang = (() => {
      const v = (typeof targetLang === "string" ? targetLang : (typeof lang === "string" ? lang : "fr"));
      if (v === "fr" || v === "es" || v === "zh-Hans" || v === "zh-Hant" || v === "ja") return v;
      return "fr";
    })();

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

    const { systemPrompt, useToolCalling } = buildSystemPrompt(
      target,
      primaryLang,
      typeof type === "string" ? type : "",
      vocabularyContext,
    );

    const requestBody: Record<string, unknown> = {
      model: type === "inline-assist" ? "google/gemini-2.5-flash-lite" : "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is my ${targetName(target)} journal entry:\n\n${text}` },
      ],
    };

    if (useToolCalling) {
      requestBody.tools = [inlineAssistTool(target)];
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

    // Handle tool-calling response for inline-assist
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
    console.error("Error in language-feedback function:", error);
    return new Response(JSON.stringify({
      error: "Feedback service error",
      code: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
