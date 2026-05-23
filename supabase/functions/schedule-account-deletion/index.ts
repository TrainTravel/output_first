// GDPR Article 17 — schedules a soft delete 30 days out.
//
// Auth: caller's JWT must match the user being scheduled (we never let one
// user schedule another).
//
// Behavior: upserts a row in public.profiles with scheduled_deletion_at set
// to now() + 30 days. Idempotent — re-running just refreshes the timestamp.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRACE_PERIOD_DAYS = 30;

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

    const scheduledAt = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await admin
      .from("profiles")
      .upsert(
        { id: auth.userId, scheduled_deletion_at: scheduledAt, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      );

    if (error) {
      console.error("schedule-account-deletion upsert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to schedule deletion", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ scheduled_deletion_at: scheduledAt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in schedule-account-deletion:", error);
    return new Response(
      JSON.stringify({
        error: "Service error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
