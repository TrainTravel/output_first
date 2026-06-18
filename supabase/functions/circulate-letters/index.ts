// Cron-style sweep for the Circulation of Love.
//
// Flips `archived = true` on every `love_letters` row whose `expires_at < now()`
// and is still `archived = false`. Authors retain access (RLS); other users
// stop seeing it.
//
// Invocation: either Supabase Scheduled Function (preferred — daily at 03:00)
// or external cron. Idempotent — running it twice in a row is a no-op.
//
// Auth: requires a Bearer token equal to env CIRCULATION_CRON_SECRET. The
// secret is set in supabase secrets and rotated by Train. Distinct from
// user-facing edge fns so a leaked user JWT cannot trigger archival.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const expected = Deno.env.get("CIRCULATION_CRON_SECRET");
  const provided = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Storage not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const admin = createClient(supabaseUrl, serviceKey);

  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("love_letters")
    .update({ archived: true })
    .lt("expires_at", nowIso)
    .eq("archived", false)
    .select("id");

  if (error) {
    console.error("circulate-letters: archive error", error);
    return new Response(JSON.stringify({ error: "Archive failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ archived: data?.length ?? 0, at: nowIso }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
