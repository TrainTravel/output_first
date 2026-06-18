// Pre-publish moderation for Circulation of Love letters.
//
// Flow: client sends { content, language, pseudonym, ttl_days }. We run the
// content past Gemini 2.5 Flash, then insert the row with the verdict baked
// in — atomic moderation + insert so the client cannot post a row whose
// moderation state was decided client-side.
//
// Spec: docs/specs/love-circulation.md (Moderation — non-negotiable).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, badRequest, isStringWithin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_LANGS = ["en", "fr", "es", "ja", "zh-Hans", "zh-Hant"] as const;
const VALID_TTL = [7, 14, 30] as const;
type Lang = typeof VALID_LANGS[number];
type TTL = typeof VALID_TTL[number];

// Reviewed carefully — see spec for rationale.
const moderationSystemPrompt = `You are reviewing a short, anonymous letter someone wants to share publicly with strangers who speak their language. Letters live for 7-30 days, then archive. The goal of the system is to circulate hope, grief, comfort, and small honest moments — NOT a feel-good filter.

You return JSON only:
{ "decision": "pass" | "softfail" | "block", "note": "<≤25 words, written TO the author in their letter's language; only present when decision is softfail or block>" }

PASS (the wide door — this is the whole point of the feature):
- Sad, lonely, angry, grieving, exhausted, ambivalent, bittersweet, regretful
- Small ordinary moments (the tea was good, the bus was late, the cat slept on me)
- Mental health symptoms described non-acutely
- Religious or philosophical reflection if non-extremist
- Imperfect prose, fragments, typos — leave them alone
- Mild profanity used non-aggressively

SOFTFAIL (gentle rewrite suggestion — author re-edits and retries):
- Vague mention of suicide/self-harm that may or may not be acute — ask the author to clarify if they're in crisis (and offer the crisis line) OR rewrite as reflection
- Content that names a specific real person identifiably (even non-malicious) — ask them to use initials or a relationship word
- Plausibly accidental PII (an address, phone number, email) — ask them to remove it
- Content that reads like a private message to one person ("I miss you so much, please call me") — ask them to make it more universal

BLOCK (do not enter circulation):
- Explicit suicidal intent, method, or plan in present tense ("tonight I will...", "I have the pills")
- Targeted harassment of a person, group, religion, or identity
- Sexually explicit content
- Spam, promotion, links, codes, contact info as the primary message
- Hate speech, slurs, dehumanization
- Doxxing (full name + location, real phone number, etc.)

Tone of the note (softfail and block):
- Soft, second person, NEVER shaming
- For self-harm cases, include a crisis line phrase like "If you are in crisis right now, please call your local emergency line or a crisis hotline."
- Match the letter's language (en, fr, es, ja, zh-Hans, zh-Hant).
- ≤25 words.

Reply with JSON only, no markdown, no preface. If the input is empty or only whitespace, decision = "block", note in English saying "Your letter is empty."`;

interface ModerationVerdict {
  decision: "pass" | "softfail" | "block";
  note: string | null;
}

async function moderate(apiKey: string, content: string, language: Lang): Promise<ModerationVerdict> {
  const userMessage = `Letter language: ${language}\nLetter content:\n"""\n${content}\n"""`;
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: moderationSystemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    // Fail closed — never auto-publish on gateway error.
    console.error("moderate-letter: gateway error", response.status, await response.text());
    return { decision: "softfail", note: "We couldn't review your letter just now. Please try again in a moment." };
  }
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  let parsed: { decision?: unknown; note?: unknown } = {};
  try { parsed = JSON.parse(raw); } catch { /* fall through */ }

  const decision = parsed.decision === "pass" || parsed.decision === "softfail" || parsed.decision === "block"
    ? parsed.decision
    : "softfail";
  const note = typeof parsed.note === "string" ? parsed.note.slice(0, 300) : null;
  return { decision, note: decision === "pass" ? null : note };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Invalid JSON body", corsHeaders);

    const { content, language, pseudonym, ttl_days } = body as Record<string, unknown>;
    if (!isStringWithin(content, 1, 500)) return badRequest("content must be 1-500 chars", corsHeaders);
    if (typeof language !== "string" || !(VALID_LANGS as readonly string[]).includes(language)) {
      return badRequest("language must be one of: " + VALID_LANGS.join(", "), corsHeaders);
    }
    if (!isStringWithin(pseudonym, 1, 60)) return badRequest("pseudonym must be 1-60 chars", corsHeaders);
    const ttl = typeof ttl_days === "number" && (VALID_TTL as readonly number[]).includes(ttl_days)
      ? (ttl_days as TTL) : 14;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured", code: "API_KEY_MISSING" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verdict = await moderate(apiKey, content as string, language as Lang);

    // Insert the row with the verdict baked in. Uses service-role so RLS
    // does not block us writing `moderated_status` other than 'pending'.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Storage not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const expires = verdict.decision === "pass"
      ? new Date(now.getTime() + ttl * 24 * 60 * 60 * 1000)
      : null;

    const insert = await admin.from("love_letters").insert({
      author_id: auth.userId,
      content: content as string,
      language: language as Lang,
      pseudonym: pseudonym as string,
      moderated_status: verdict.decision === "pass" ? "passed" : verdict.decision === "softfail" ? "softfailed" : "blocked",
      moderation_note: verdict.note,
      posted_at: verdict.decision === "pass" ? now.toISOString() : null,
      expires_at: expires?.toISOString() ?? null,
    }).select("id, moderated_status, moderation_note, posted_at, expires_at, pseudonym").single();

    if (insert.error) {
      console.error("moderate-letter: insert error", insert.error);
      return new Response(JSON.stringify({ error: "Could not save your letter", code: "INSERT_FAILED" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      letter: insert.data,
      verdict: verdict.decision,
      note: verdict.note,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("moderate-letter error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
