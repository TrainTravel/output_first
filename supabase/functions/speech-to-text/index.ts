import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

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


    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY secret is not set in Supabase");
      return new Response(JSON.stringify({
        error: "AI service not configured",
        code: "API_KEY_MISSING",
        details: "Contact app administrator to configure OPENAI_API_KEY",
      }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const language = (formData.get("language") as string | null) ?? "fr";

    if (!audio) {
      return new Response(JSON.stringify({ error: "No audio file provided", code: "INTERNAL_ERROR" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward to OpenAI Whisper — do NOT set Content-Type, fetch sets the multipart boundary
    const whisperForm = new FormData();
    whisperForm.append("file", new File([audio], "audio.webm", { type: audio.type || "audio/webm" }));
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", language === "es" ? "es" : language === "en" ? "en" : "fr");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const errorText = await whisperRes.text();
      console.error("Whisper API error:", whisperRes.status, errorText);

      if (whisperRes.status === 429) {
        return new Response(JSON.stringify({
          error: "Too many requests. Please wait a moment.",
          code: "RATE_LIMIT",
        }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (whisperRes.status === 401 || whisperRes.status === 403) {
        return new Response(JSON.stringify({
          error: "AI service authentication failed.",
          code: "AI_AUTH_FAILED",
        }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        error: "Transcription failed.",
        code: "WHISPER_ERROR",
        details: `Whisper returned ${whisperRes.status}: ${errorText.substring(0, 100)}`,
      }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await whisperRes.json();
    const text: string = data.text ?? "";

    console.log("Transcription result:", text.substring(0, 80));

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in speech-to-text function:", error);
    return new Response(JSON.stringify({
      error: "Transcription service error",
      code: "INTERNAL_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
