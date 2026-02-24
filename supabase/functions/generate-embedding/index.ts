import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { thoughtId, content } = await req.json();

    if (!thoughtId || !content) {
      return new Response(
        JSON.stringify({ error: "thoughtId and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use chat completions with tool calling to generate a semantic embedding vector
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are an embedding generator. Given a piece of text, produce a 768-dimensional numeric vector that captures its semantic meaning. Each value should be a float between -1 and 1. Call the store_embedding function with the vector.`,
            },
            {
              role: "user",
              content: `Generate a semantic embedding vector for the following text:\n\n"${content}"`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "store_embedding",
                description: "Store a 768-dimensional semantic embedding vector for a thought.",
                parameters: {
                  type: "object",
                  properties: {
                    embedding: {
                      type: "array",
                      items: { type: "number" },
                      description: "A 768-dimensional vector of floats between -1 and 1 representing the semantic meaning of the text.",
                    },
                  },
                  required: ["embedding"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "store_embedding" } },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "store_embedding") {
      console.error("Unexpected response:", JSON.stringify(data));
      throw new Error("Model did not return embedding via tool call");
    }

    const args = JSON.parse(toolCall.function.arguments);
    let embedding = args.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding in tool call response");
    }

    // Ensure exactly 768 dimensions - pad or truncate if needed
    if (embedding.length < 768) {
      embedding = [...embedding, ...new Array(768 - embedding.length).fill(0)];
    } else if (embedding.length > 768) {
      embedding = embedding.slice(0, 768);
    }

    // Normalize: clamp values to [-1, 1]
    embedding = embedding.map((v: number) => Math.max(-1, Math.min(1, Number(v) || 0)));

    // Store embedding in the thoughts table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("thoughts")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", thoughtId);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw new Error(`Failed to store embedding: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-embedding error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
