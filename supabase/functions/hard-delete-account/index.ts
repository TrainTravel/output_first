// GDPR Article 17 — hard delete after the 30-day grace window has expired.
//
// Auth: caller's JWT. We refuse to delete unless their profile row's
// scheduled_deletion_at is set AND is in the past.
//
// v1 limitation: this is invoked lazily on the user's next sign-in by the
// AccountScreen. A user who never returns after day 30 will not actually be
// purged until they come back. Production should add a pg_cron job that
// invokes this function for every expired row.
//
// What we purge:
//   - thoughts            (user_anonymous_id = userId)
//   - clusters            (user_anonymous_id = userId; CASCADE → cluster_thoughts, proposals)
//   - journal_entries     (user_id = userId)
//   - experiments         (user_id = userId; CASCADE → experiment_checkins)
//   - feedback            (user_anonymous_id = userId)
//   - profiles            (id = userId; CASCADE from auth.users will also cover)
//   - auth.users          (deletes the auth account itself)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Confirm the user has actually elected deletion AND the window has expired.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("scheduled_deletion_at")
      .eq("id", auth.userId)
      .maybeSingle();

    if (profileError) {
      console.error("hard-delete-account profile fetch error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to read profile", details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!profile?.scheduled_deletion_at) {
      return new Response(
        JSON.stringify({ error: "No deletion is scheduled for this account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (new Date(profile.scheduled_deletion_at).getTime() > Date.now()) {
      return new Response(
        JSON.stringify({
          error: "Grace period has not expired yet",
          scheduled_deletion_at: profile.scheduled_deletion_at,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Purge per-table. Errors are logged but we keep going so we don't leave
    //    half-purged accounts behind. The auth.users delete at the end is the
    //    "ultimate kill switch" — even if a table delete fails, the user can no
    //    longer authenticate.
    const userIdText = auth.userId;

    const tables: Array<{ name: string; column: string }> = [
      { name: "thoughts", column: "user_anonymous_id" },
      { name: "clusters", column: "user_anonymous_id" }, // CASCADE clears cluster_thoughts + proposals
      { name: "journal_entries", column: "user_id" },
      { name: "experiments", column: "user_id" }, // CASCADE clears experiment_checkins
      { name: "feedback", column: "user_anonymous_id" },
    ];

    for (const { name, column } of tables) {
      const { error } = await admin.from(name).delete().eq(column, userIdText);
      if (error) {
        console.error(`hard-delete-account: failed to purge ${name}:`, error.message);
      }
    }

    // 3. Delete the auth user. This cascades to public.profiles via FK.
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(auth.userId);
    if (deleteUserError) {
      console.error("hard-delete-account auth delete error:", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Failed to delete auth user", details: deleteUserError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ deleted: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in hard-delete-account:", error);
    return new Response(
      JSON.stringify({
        error: "Service error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
