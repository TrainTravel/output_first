import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, badRequest, isStringWithin } from "../_shared/auth.ts";

/**
 * cbt-assist — adapted, neurodiversity-affirming CBT helpers.
 *
 * Modes:
 *   "shrink-step"  (implemented) — offers 2–3 smaller versions of a task
 *                                  the user does not yet feel able to start.
 *
 * PHASE 2 (not built): mode "reframe". The intent is a reframe that doubles as
 * a language lesson — a native-speaker rendering of the user's thought that
 * feeds the spaced-repetition vocabulary system. Explicitly NOT a distortion
 * picker, NOT metaphor cards, and never framed as "your thought was distorted".
 * It slots into the switch below and reuses buildLangContext() unchanged.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const shrinkStepPrompt = `You help someone with ADHD make a task small enough to actually start.

They named a step and rated their honest confidence that they'll do it (1-10).
The rating is low. Your job: offer 2-3 SMALLER versions of the same step.

Rules:
- Each option must be a genuine subset or first slice of their step — not a different task.
- Aim for something doable in under 5 minutes, or a single physical action.
- "Open the document" beats "write the intro". "Put the shoes by the door" beats "go for a run".
- Preparation and setup count as real steps.
- Never mention discipline, willpower, motivation, procrastination, or "just".
- No praise, no shame, no exclamation marks. Plain and warm.
- Each option is one short line, max 12 words.

Reply with JSON only — no markdown:
{ "options": ["...", "...", "..."] }

Write the options in the language given by primaryLang.`;

function buildLangContext(body: Record<string, unknown>): string {
  const primaryLang = typeof body.primaryLang === "string" ? body.primaryLang : "en";
  const targetLang = typeof body.targetLang === "string" ? body.targetLang : "";
  const knownLangs = Array.isArray(body.knownLangs)
    ? (body.knownLangs as unknown[]).filter(l => typeof l === "string").join(", ")
    : "";
  return `primaryLang: ${primaryLang}${targetLang ? `\ntargetLang: ${targetLang}` : ""}${knownLangs ? `\nknownLangs: ${knownLangs}` : ""}`;
}

function gatewayFailure(status: number): Response {
  // Friendly, non-technical copy — surfaced directly in the app.
  let message = "The suggestions didn't come through. You can write a smaller step yourself.";
  let code = "GATEWAY_ERROR";
  if (status === 402) {
    message = "AI suggestions are paused right now. You can still write a smaller step yourself.";
    code = "CREDITS_EXHAUSTED";
  } else if (status === 429) {
    message = "A lot of requests at once — try again in a moment, or write a smaller step yourself.";
    code = "RATE_LIMITED";
  }
  return new Response(JSON.stringify({ error: message, code }), {
    status: status === 402 ? 402 : status === 429 ? 429 : 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    const payload = body as Record<string, unknown>;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured", code: "API_KEY_MISSING" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mode = payload.mode;

    switch (mode) {
      case "shrink-step": {
        const { step, confidence, previousOptions } = payload;
        if (!isStringWithin(step, 1, 500)) {
          return badRequest("step must be 1-500 chars", corsHeaders);
        }
        if (typeof confidence !== "number" || confidence < 1 || confidence > 10) {
          return badRequest("confidence must be a number 1-10", corsHeaders);
        }
        const already = Array.isArray(previousOptions)
          ? (previousOptions as unknown[]).filter(o => typeof o === "string").slice(0, 12)
          : [];

        const userMessage = [
          `Their step: "${step}"`,
          `Their confidence: ${confidence}/10`,
          already.length ? `Already offered (do not repeat, go smaller):\n${already.map(o => `- ${o}`).join("\n")}` : "",
          buildLangContext(payload),
        ].filter(Boolean).join("\n\n");

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: shrinkStepPrompt },
              { role: "user", content: userMessage },
            ],
          }),
        });

        if (!response.ok) {
          console.error("AI gateway error (shrink-step):", response.status, await response.text());
          return gatewayFailure(response.status);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? "";

        let options: string[] = [];
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.options)) {
            options = parsed.options
              .filter((o: unknown): o is string => typeof o === "string" && o.trim().length > 0)
              .map((o: string) => o.trim().slice(0, 200))
              .slice(0, 3);
          }
        } catch {
          // Model returned something unparseable — the client falls back to
          // "write your own smaller step", which is always available anyway.
        }

        return new Response(JSON.stringify({ options }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return badRequest("Unsupported mode", corsHeaders);
    }
  } catch (error) {
    console.error("cbt-assist error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
