import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, badRequest } from "../_shared/auth.ts";

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
- One idea per response only — never stack questions or observations
- This is a safe, low-stakes space — warmth always takes priority over clinical accuracy
- Crisis clause: if the user expresses distress, hopelessness, or mentions self-harm, immediately stop all CBT techniques and respond only with: "${crisisSentence(target)}"
`;
}

interface ThoughtCtx {
  mode: string;
  label: string;
  thoughts: Array<{ content: string; createdAt: string; aiTheme: string | null }>;
  clusterDescription?: string;
}

function formatThoughts(target: TargetLang, thoughts: ThoughtCtx["thoughts"]): string {
  const locale = isChinese(target)
    ? "zh-CN"
    : target === "ja"
    ? "ja-JP"
    : target === "es"
    ? "es-ES"
    : "fr-FR";
  return thoughts
    .slice(0, 15)
    .map((t) => {
      const date = new Date(t.createdAt).toLocaleDateString(locale, { month: "short", day: "numeric" });
      const theme = t.aiTheme ? `[${t.aiTheme}]` : "";
      const content = t.content.length > 150 ? t.content.substring(0, 150) + "..." : t.content;
      return `${theme} "${content}" - ${date}`;
    })
    .join("\n");
}

function emotionGranularityExamples(target: TargetLang): string {
  if (isChinese(target)) {
    return `EMOTIONAL GRANULARITY:
When detecting vague emotion words, offer 2-3 more precise alternatives:
- "好" → 愉快 (yúkuài), 心满意足 (xīn mǎn yì zú), 踏实 (tāshi)
- "不好" → 沮丧 (jǔsàng), 失落 (shīluò), 烦闷 (fánmèn)
- "累" → 疲惫 (píbèi), 精疲力尽 (jīng pí lì jìn), 身心俱疲 (shēn xīn jù pí)
- "紧张" → 忐忑不安 (tǎntè bù'ān), 如坐针毡 (rú zuò zhēn zhān)
- "高兴" → 欣喜若狂 (xīnxǐ ruò kuáng), 心花怒放 (xīn huā nù fàng)
- "难过" → 心如刀割 (xīn rú dāo gē), 黯然神伤 (àn rán shén shāng)`;
  }
  if (target === "ja") {
    return `EMOTIONAL GRANULARITY:
When detecting vague emotion words, offer 2-3 more precise alternatives:
- "いい" → 嬉しい (ureshii), 安心 (anshin), 穏やか (odayaka)
- "わるい" → 落ち込んでいる (ochikondeiru), もどかしい (modokashii), 情けない (nasakenai)
- "つかれた" → くたくた (kutakuta), 燃え尽きた (moetsukita), 疲弊 (hihei)
- "ストレス" → 緊張 (kinchō), 圧倒される (attō sareru), もやもや (moyamoya)`;
  }
  if (target === "es") {
    return `EMOTIONAL GRANULARITY:
When detecting vague emotion words, offer 2-3 more precise alternatives:
- "mal" → agotado, desanimado, abrumado
- "estresado" → ansioso, desbordado, tenso
- "bien" → sereno, agradecido, aliviado
- "triste" → melancólico, nostálgico, decepcionado
- "contento" → encantado, aliviado, entusiasmado
- "cansado" → exhausto, agotado, vacío`;
  }
  // French (default fallback).
  return `EMOTIONAL GRANULARITY:
When detecting vague emotion words, offer 2-3 more precise alternatives:
- "mal" → épuisé, découragé, accablé
- "stressé" → anxieux, submergé, tendu
- "bien" → serein, reconnaissant, soulagé
- "triste" → mélancolique, nostalgique, déçu
- "content" → ravi, soulagé, enthousiaste
- "fatigué" → épuisé, las, vidé`;
}

function cbtBlock(target: TargetLang): string {
  const tname = targetName(target);
  if (isChinese(target)) {
    return `

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
- Use ${tname} primarily, with pinyin and English for key terms`;
  }
  if (target === "ja") {
    return `

CBT-INFORMED EXPLORATION:
You are NOT a therapist. You use CBT-inspired techniques gently.

TECHNIQUES (one at a time, never forced):
1. Thought Records — "そのとき、最初に浮かんだ考えは？(What was your first thought?)"
2. Cognitive Distortions — "ちょっと面白いパターンに気づきました…(I notice an interesting pattern…)"
3. Behavioral Experiments — "試してみたら？(What if you tried…?)"
4. Evidence Gathering — "その考えを支える根拠は？(What evidence supports this thought?)"

CRITICAL RULES:
- ONE technique per exchange maximum
- Always validate the emotion FIRST
- Frame everything as curiosity, not correction
- Use ${tname} primarily in polite register (です・ます形, not keigo). Include furigana — hiragana readings in parentheses — for kanji the learner may not know, e.g. 考(かんが)え. Add English glosses for key terms.`;
  }
  if (target === "es") {
    return `

CBT-INFORMED EXPLORATION (Cognitive Behavioral Therapy techniques):
You are NOT a therapist. You use CBT-inspired techniques gently to help the user explore their thinking patterns with curiosity, not clinical analysis.

TECHNIQUES TO WEAVE IN NATURALLY (one at a time, never forced):
1. **Thought Records** — When the user describes a situation, gently separate: the situation → their automatic thought → the emotion it triggered. Ask: "¿Cuál fue tu primer pensamiento cuando eso pasó?" (What was your first thought when that happened?)
2. **Cognitive Distortions (gentle noticing)** — If you notice patterns like all-or-nothing thinking, catastrophizing, or mind-reading, name them compassionately: "Noto un patrón interesante aquí…" (I notice an interesting pattern here…). Never say "you're wrong" — say "¿hay otra forma de verlo?" (is there another way to see this?)
3. **Behavioral Experiments** — Suggest small, low-stakes actions: "¿Y si lo intentaras… ?" (What if you tried…?)
4. **Downward Arrow** — When a thought seems loaded, explore what's underneath: "Si fuera cierto, ¿qué significaría para ti?" (If it were true, what would it mean for you?)
5. **Evidence Gathering** — Help them examine evidence for and against a thought: "¿Qué evidencia tienes a favor de ese pensamiento? ¿Y en contra?" (What evidence supports this thought? And against it?)
6. **Values Alignment** — Connect reflections to what matters: "¿Por qué es importante esto para ti?" (Why does this matter to you?)

CRITICAL RULES FOR CBT:
- ONE technique per exchange maximum — never stack techniques
- Always validate the emotion FIRST, then explore the thought
- Frame everything as curiosity, never correction
- If the user seems distressed, STOP techniques and just be supportive
- Use ${tname} primarily, with English in parentheses for CBT-specific terms
- Use tú (informal) — natural for journaling/coaching context, not usted
- Never diagnose, label, or pathologize`;
  }
  // French (default fallback).
  return `

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
- Use ${tname} primarily, with English in parentheses for CBT-specific terms
- Never diagnose, label, or pathologize`;
}

function buildSystemPrompt(
  target: TargetLang,
  primary: unknown,
  ctx: ThoughtCtx | undefined,
  knownLangs?: string[],
): string {
  const userContextBlock = buildUserContextBlock(target, primary, knownLangs);
  const tname = targetName(target);
  const supportSuffix = isChinese(target)
    ? `${tname} with pinyin`
    : target === "ja"
    ? `${tname} with readings`
    : tname;

  const basePrompt = `${userContextBlock}
You are a warm, supportive ${tname} conversation partner who helps people:
1. Practice expressing themselves in ${tname}
2. Build emotional awareness through reflection
3. Develop emotional vocabulary granularity

YOUR APPROACH:
- Respond primarily in ${tname}${isChinese(target) ? " with pinyin and English translations for key vocabulary" : target === "ja" ? " with furigana (hiragana readings in parentheses for kanji the learner may not know) and English translations for key vocabulary. Use polite register (です・ます形), not keigo or plain form" : " with occasional English translations for key vocabulary"}
- Ask gentle follow-up questions to encourage deeper expression
- When users express emotions, help them find more precise ${tname} words
- Celebrate their attempts to express themselves
- Never correct errors harshly — model correct usage naturally
- Keep responses concise (2-4 sentences typically)

${emotionGranularityExamples(target)}

TONE:
- Warm and encouraging, like a supportive friend
- Non-judgmental about emotions — all feelings are valid signals
- Focus on expression, not perfection
- Help users name what they feel, never analyze WHY they feel it`;

  if (!ctx || !ctx.thoughts || ctx.thoughts.length === 0) {
    return basePrompt + `\n\nStart conversations with a gentle, open question in ${supportSuffix}.`;
  }

  const formattedThoughts = formatThoughts(target, ctx.thoughts);
  const cbt = cbtBlock(target);

  let contextInstructions = "";

  switch (ctx.mode) {
    case "all":
      contextInstructions = `
${cbt}

CONTEXT - USER'S THOUGHT GARDEN:
The user has recorded these personal thoughts and reflections. You already have full context — start by acknowledging a pattern you notice across their thoughts, and invite them to explore it. Use CBT-style curiosity.

${formattedThoughts}

Start by warmly noting a theme or pattern you see across their thoughts, and ask a CBT-informed question about one that seems emotionally significant. Use ${supportSuffix}.`;
      break;

    case "theme":
      contextInstructions = `
${cbt}

CONTEXT - FOCUSED THEME: ${ctx.label}
The user wants to explore their thoughts specifically about "${ctx.label}". These are their recorded thoughts in this area:

${formattedThoughts}

You already have full context of their thoughts. Start by reflecting back what you notice in their thinking patterns around "${ctx.label}" and ask a gentle CBT-informed question to help them explore their automatic thoughts in this area. Use ${supportSuffix}.`;
      break;

    case "cluster":
      contextInstructions = `
${cbt}

CONTEXT - USER'S CLUSTER: ${ctx.label}
${ctx.clusterDescription ? `Description: ${ctx.clusterDescription}` : ""}
The user has intentionally grouped these thoughts together:

${formattedThoughts}

You already have full context. Start by reflecting what you see as the connecting thread between these thoughts, and use a CBT technique (thought record or downward arrow) to help them explore what these thoughts reveal about their core beliefs or values. Begin in ${supportSuffix}. Be warm and curious, not clinical.`;
      break;

    default:
      return basePrompt + `\n\nStart conversations with a gentle, open question in ${supportSuffix}.`;
  }

  return basePrompt + contextInstructions;
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
    const { messages, thoughtContext, targetLang, lang, primaryLang, knownLangs } = body as {
      messages?: unknown; thoughtContext?: unknown;
      targetLang?: unknown; lang?: unknown; primaryLang?: unknown; knownLangs?: unknown;
    };

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
      return badRequest("messages must be an array of 1-100 items", corsHeaders);
    }
    for (const m of messages) {
      if (!m || typeof m !== "object") return badRequest("invalid message", corsHeaders);
      const { role, content } = m as { role?: unknown; content?: unknown };
      if (role !== "user" && role !== "assistant" && role !== "system") {
        return badRequest("invalid message role", corsHeaders);
      }
      if (typeof content !== "string" || content.length === 0 || content.length > 10000) {
        return badRequest("message content must be 1-10000 chars", corsHeaders);
      }
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

    const target: TargetLang = (() => {
      const v = (typeof targetLang === "string" ? targetLang : (typeof lang === "string" ? lang : "fr"));
      if (v === "fr" || v === "es" || v === "zh-Hans" || v === "zh-Hant" || v === "ja") return v;
      return "fr";
    })();

    console.log("Chat request with messages:", messages.length, "target:", target);

    const ctx = (thoughtContext && typeof thoughtContext === "object")
      ? (thoughtContext as ThoughtCtx)
      : undefined;
    const systemPrompt = buildSystemPrompt(target, primaryLang, ctx);

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
    console.error("Error in language-chat function:", error);
    return new Response(JSON.stringify({
      error: "Chat service error",
      code: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
