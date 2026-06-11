import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, badRequest, isStringWithin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const abcSystemPrompt = `You are a compassionate ADHD coach helping someone triage their to-do list.

Given a task, classify it as:
- A: urgent AND important — must happen today (deadlines, consequences if skipped)
- B: important but not today — worth doing soon but no immediate urgency
- C: everything else — nice to have, low stakes, can wait

Reply with JSON only — no markdown, no extra text:
{ "priority": "A" | "B" | "C", "reason": "<15 words max, no judgment>" }

Never add shame, never use words like "should" or "must". Keep the reason factual and brief.
Respond in the language specified by the lang parameter.`;

const eisenhowerSystemPrompt = `You are a compassionate ADHD coach triaging a brain dump.

For each input item, decide two things:

1. isTask: is this an actionable to-do?
   - true if the text describes an intent to do something specific (even loosely)
   - false if it's a thought, feeling, observation, memory, or reflection with no action

2. quadrant (only when isTask is true; use null otherwise):
   - q1: Urgent + Important — must happen soon AND has consequences (deadlines, crises)
   - q2: Important, Not Urgent — meaningful but no time pressure (planning, growth, relationships)
   - q3: Urgent, Not Important — time pressure but low stakes (interruptions, others' small requests)
   - q4: Neither — nice-to-have, low stakes, no deadline

=== CRITICAL ANTI-DEFAULT RULE ===
Do NOT default to q2 just because no explicit deadline is given. A board where every
item lands in q2 is useless — it teaches the user nothing. When the text has no
temporal marker, infer urgency from the TASK TYPE itself using the following rules.

Time-marker rules (apply first if a marker exists):
- "今天" / "today" / "by today" / "tonight" → consider q1 if important, q3 if not
- "明天" / "tomorrow" / "this week" / "before [near date]" → q1 if important
- "一個月" / "一个月" / "next month" / "in [N] months" → q2 if important, q4 otherwise
- "有空" / "when I have time" / "someday" / "eventually" → q4 if low stakes, q2 if growth

Task-type heuristics (apply when no temporal marker is given):
- Groceries, errands, replies to messages, returning calls, buying perishables
  → typically q1 or q3 (same-day or same-week reality)
  (例: "我要去買菜" / "buy groceries" / "réponds à Marie" → q1 if life-blocking, q3 if not)
- Booking flights/hotels/appointments that are weeks+ out
  → q2 (important, but you have time)
- Decluttering, organizing the house, tidying, "sometime soon I want to..."
  → q4 (genuinely no rush — be honest about this)
  (例: "我要整理家裡" / "organize the apartment" → q4)
- Helping a friend with a one-off task (resume review, advice)
  → q3 if their deadline is implied, q4 if open-ended
- Health (doctor visit, dentist, prescription refill)
  → q1 if symptomatic / overdue, q2 if routine
- Career-growth tasks (study, apply for jobs, build a skill, write portfolio)
  → q2 (the canonical q2 case)
- Personal-relationship tasks (call mom, schedule date night, write a thank-you note)
  → q1 if overdue, q2 if maintenance

Distribution check before responding:
- If your output has more than 60% of items in q2 across a batch ≥ 4, re-examine.
  Most batches have a real mix of urgencies — force yourself to distinguish.
- It is OK and often correct to put many items in q4. Honesty about "this is a
  someday wish" frees the user from guilt.

Reply with JSON only — no markdown, no extra text:
{ "classifications": [
  { "id": "<input id>", "isTask": <bool>, "quadrant": "q1"|"q2"|"q3"|"q4"|null, "reasoning": "<15 words max>" }
] }

Preserve every input id exactly. Never add shame, never use "should" or "must". Keep reasoning factual and brief.
Write reasoning in the language code given by primaryLang.`;

const EISENHOWER_MAX_BATCH = 50;
const VALID_QUADRANTS = ['q1', 'q2', 'q3', 'q4'] as const;
type Quadrant = typeof VALID_QUADRANTS[number];

interface EisenhowerInput { id: string; content: string }
interface EisenhowerClassification {
  id: string;
  isTask: boolean;
  quadrant: Quadrant | null;
  reasoning: string;
}

async function callGateway(apiKey: string, systemPrompt: string, userMessage: string): Promise<Response> {
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured", code: "API_KEY_MISSING" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mode = (body as Record<string, unknown>).mode;

    // ---- Eisenhower batch mode: classifies isTask + quadrant for each item ----
    if (mode === 'eisenhower') {
      const { items, lang, primaryLang } = body as {
        items?: unknown; lang?: unknown; primaryLang?: unknown;
      };
      if (!Array.isArray(items) || items.length === 0 || items.length > EISENHOWER_MAX_BATCH) {
        return badRequest(`items must be a non-empty array (≤${EISENHOWER_MAX_BATCH})`, corsHeaders);
      }
      const validated: EisenhowerInput[] = [];
      for (const it of items) {
        if (!it || typeof it !== 'object') {
          return badRequest("each item must be an object with id and content", corsHeaders);
        }
        const obj = it as Record<string, unknown>;
        if (typeof obj.id !== 'string' || obj.id.length === 0 || obj.id.length > 100) {
          return badRequest("each item.id must be a non-empty string ≤100 chars", corsHeaders);
        }
        if (!isStringWithin(obj.content, 1, 500)) {
          return badRequest("each item.content must be a string 1-500 chars", corsHeaders);
        }
        validated.push({ id: obj.id, content: obj.content as string });
      }

      const userMessage = `Items to classify (${validated.length}):\n${JSON.stringify(validated)}\n\nprimaryLang: ${primaryLang || lang || 'en'}`;
      const response = await callGateway(LOVABLE_API_KEY, eisenhowerSystemPrompt, userMessage);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error (eisenhower):", response.status, errorText);
        return new Response(JSON.stringify({ error: "AI service error", code: "GATEWAY_ERROR" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';

      let parsed: { classifications?: unknown } = {};
      try { parsed = JSON.parse(content); } catch { /* fall through */ }

      const inputIds = new Set(validated.map(i => i.id));
      const out: EisenhowerClassification[] = [];

      if (Array.isArray(parsed.classifications)) {
        for (const raw of parsed.classifications) {
          if (!raw || typeof raw !== 'object') continue;
          const c = raw as Record<string, unknown>;
          if (typeof c.id !== 'string' || !inputIds.has(c.id)) continue;
          const isTask = c.isTask === true;
          const quadrantRaw = typeof c.quadrant === 'string' ? c.quadrant.toLowerCase() : null;
          const quadrant = isTask && (VALID_QUADRANTS as readonly string[]).includes(quadrantRaw ?? '')
            ? (quadrantRaw as Quadrant)
            : null;
          const reasoning = typeof c.reasoning === 'string' ? c.reasoning.slice(0, 200) : '';
          out.push({ id: c.id, isTask, quadrant, reasoning });
        }
      }

      // Fallback: any input id missing from the AI's response gets {isTask: false, quadrant: null}
      // so the caller always sees one row per input.
      const seen = new Set(out.map(r => r.id));
      for (const item of validated) {
        if (!seen.has(item.id)) {
          out.push({ id: item.id, isTask: false, quadrant: null, reasoning: '' });
        }
      }

      return new Response(JSON.stringify({ classifications: out }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Default: ABC single-task mode (existing behavior; backward compatible) ----
    const { task, existingTasks, lang } = body as {
      task?: unknown; existingTasks?: unknown; lang?: unknown;
    };
    if (!isStringWithin(task, 1, 500)) return badRequest("task must be 1-500 chars", corsHeaders);
    if (existingTasks !== undefined && (!Array.isArray(existingTasks) || existingTasks.length > 200)) {
      return badRequest("existingTasks must be array ≤200", corsHeaders);
    }

    const existingContext = existingTasks?.length
      ? `\n\nExisting tasks for context:\n${existingTasks.map((t: { text: string; priority: string }) => `- [${t.priority}] ${t.text}`).join('\n')}`
      : '';

    const userMessage = `Task to triage: "${task}"${existingContext}\n\nLanguage: ${lang || 'en'}`;
    const response = await callGateway(LOVABLE_API_KEY, abcSystemPrompt, userMessage);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error", code: "GATEWAY_ERROR" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    let result: { priority: string; reason: string };
    try {
      result = JSON.parse(content);
    } catch {
      result = { priority: 'C', reason: '' };
    }

    if (!['A', 'B', 'C'].includes(result.priority)) {
      result.priority = 'C';
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("todo-triage error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
