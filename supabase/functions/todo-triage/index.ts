import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, badRequest, isStringWithin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a compassionate ADHD coach helping someone triage their to-do list.

Given a task, classify it as:
- A: urgent AND important — must happen today (deadlines, consequences if skipped)
- B: important but not today — worth doing soon but no immediate urgency
- C: everything else — nice to have, low stakes, can wait

Reply with JSON only — no markdown, no extra text:
{ "priority": "A" | "B" | "C", "reason": "<15 words max, no judgment>" }

Never add shame, never use words like "should" or "must". Keep the reason factual and brief.
Respond in the language specified by the lang parameter.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { task, existingTasks, lang } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured", code: "API_KEY_MISSING" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingContext = existingTasks?.length
      ? `\n\nExisting tasks for context:\n${existingTasks.map((t: { text: string; priority: string }) => `- [${t.priority}] ${t.text}`).join('\n')}`
      : '';

    const userMessage = `Task to triage: "${task}"${existingContext}\n\nLanguage: ${lang || 'en'}`;

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
          { role: "user", content: userMessage },
        ],
      }),
    });

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
      // Fallback if AI returns non-JSON
      result = { priority: 'C', reason: '' };
    }

    // Validate priority is A, B, or C
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
