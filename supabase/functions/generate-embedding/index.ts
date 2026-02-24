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
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Use AI to generate a short thematic tag for this thought
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a thought categorizer. Given a short personal thought, assign it to ONE of these 6 high-level categories. You MUST pick from this exact list — do NOT invent new categories or use the thought's own words:

- Professional Development (work, career, skills, projects, ambitions)
- Personal Wellbeing (health, emotions, self-care, energy, stress)
- Relationships & Social (family, friends, love, social life, communication)
- Creative & Intellectual (ideas, learning, curiosity, hobbies, inspiration)
- Practical & Administrative (errands, finances, logistics, planning, daily tasks)
- Values & Aspirations (identity, purpose, gratitude, fears, life goals)

Rules:
1. Pick the SINGLE best fit from the 6 categories above.
2. Use the EXACT category name — do not paraphrase or shorten it.
3. NEVER use the thought content itself as the category.
4. Call the assign_theme function with the chosen category name.`,
            },
            {
              role: "user",
              content: content,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "assign_theme",
                description: "Assign a short thematic label to a thought.",
                parameters: {
                  type: "object",
                  properties: {
                    theme: {
                      type: "string",
                      description: "A concise 1-3 word thematic label in title case.",
                    },
                  },
                  required: ["theme"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "assign_theme" } },
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

    if (!toolCall || toolCall.function.name !== "assign_theme") {
      console.error("Unexpected response:", JSON.stringify(data));
      throw new Error("Model did not return theme via tool call");
    }

    const args = JSON.parse(toolCall.function.arguments);
    const theme = args.theme;

    if (!theme || typeof theme !== "string") {
      throw new Error("Invalid theme in tool call response");
    }

    // Store theme in the thoughts table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("thoughts")
      .update({ ai_theme: theme.trim() })
      .eq("id", thoughtId);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw new Error(`Failed to store theme: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, theme: theme.trim() }),
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
