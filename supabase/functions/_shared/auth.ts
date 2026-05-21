// Shared JWT validation helper for edge functions.
// Validates the caller's Supabase JWT (anon or authenticated). Returns the
// user record on success, or a Response on failure that the caller should
// return immediately.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthSuccess {
  ok: true;
  userId: string;
  authHeader: string;
}
export interface AuthFailure {
  ok: false;
  response: Response;
}

export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AuthSuccess | AuthFailure> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Auth not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true, userId: data.user.id, authHeader };
}

// Simple input guards (avoids bringing in zod for tiny schemas).
export function badRequest(
  message: string,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: message, code: "INVALID_INPUT" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function isStringWithin(
  v: unknown,
  min: number,
  max: number,
): v is string {
  return typeof v === "string" && v.length >= min && v.length <= max;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}
