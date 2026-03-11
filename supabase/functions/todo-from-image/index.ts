import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are helping someone extract actionable tasks from an image (screenshot, photo of a whiteboard, sticky note, etc.).

Rules:
- If you can clearly identify tasks, return them using the extract_tasks tool.
- If the image is ambiguous or you need more context, use the ask_question tool to ask ONE short clarifying question.
- Keep task text concise — max 10 words each.
- Never add judgment or shame. Be factual.
- Respond in the language specified by the lang parameter.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "extract_tasks",
      description: "Return the list of tasks extracted from the image.",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: { type: "string" },
            description: "List of actionable task strings extracted from the image.",
          },
        },
        required: ["tasks"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_question",
      description: "Ask a clarifying question when the image content is unclear.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "A short clarifying question to ask the user.",
          },
        },
        required: ["question"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, mimeType, lang, clarification } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured", code: "API_KEY_MISSING" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build user message content with image
    const userContent: unknown[] = [
      {
        type: "image_url",
        image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` },
      },
    ];

    if (clarification) {
      userContent.push({
        type: "text",
        text: `The user answered your previous question: "${clarification}". Now extract the tasks. Language: ${lang || "en"}`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Extract actionable tasks from this image. Language: ${lang || "en"}`,
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    // Handle tool calls
    if (message?.tool_calls?.length) {
      const call = message.tool_calls[0];
      const fnName = call.function.name;
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(call.function.arguments);
      } catch {
        args = {};
      }

      if (fnName === "extract_tasks" && Array.isArray(args.tasks)) {
        return new Response(JSON.stringify({ tasks: args.tasks }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (fnName === "ask_question" && typeof args.question === "string") {
        return new Response(JSON.stringify({ question: args.question }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback: try to parse content as JSON
    const content = message?.content ?? "";
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.tasks)) {
        return new Response(JSON.stringify({ tasks: parsed.tasks }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch { /* not JSON */ }

    // Last resort: treat entire content as a single task
    if (content.trim()) {
      return new Response(JSON.stringify({ tasks: [content.trim()] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ tasks: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("todo-from-image error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
