// GDPR Article 20 (right to data portability) — exports every row tagged with
// the caller's user_id as a single JSON payload.
//
// Schema-versioned so future schema changes don't silently break consumers.
//
// Tables included:
//   - journal_entries     (user_id)
//   - thoughts            (user_anonymous_id)
//   - clusters            (user_anonymous_id) + the cluster_thoughts links
//   - proposals           (joined via cluster_id)
//   - experiments         (user_id) + experiment_checkins
//
// Feedback is intentionally OMITTED — it's stored anonymously and the SELECT
// policy already denies all reads. Users can re-submit feedback if they want it
// archived locally.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEMA_VERSION = 1;

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
    const userIdText = auth.userId;

    // Fetch all per-user tables in parallel. Each Supabase call returns
    // { data, error } — we don't crash on a single-table failure; we surface
    // the table as an empty array and log the error so the user still gets
    // *something* downloadable.
    async function safeFetch(table: string, column: string): Promise<unknown[]> {
      const { data, error } = await admin.from(table).select("*").eq(column, userIdText);
      if (error) {
        console.error(`export-user-data: failed to fetch ${table}:`, error.message);
        return [];
      }
      return data ?? [];
    }

    const [journalEntries, thoughts, clusters, experiments] = await Promise.all([
      safeFetch("journal_entries", "user_id"),
      safeFetch("thoughts", "user_anonymous_id"),
      safeFetch("clusters", "user_anonymous_id"),
      safeFetch("experiments", "user_id"),
    ]);

    // Cluster-scoped child rows (cluster_thoughts, proposals) and experiment-
    // scoped child rows (experiment_checkins) — fetched only when there are
    // parent rows to avoid empty IN () SQL.
    const clusterIds = (clusters as Array<{ id: string }>).map((c) => c.id);
    const experimentIds = (experiments as Array<{ id: string }>).map((e) => e.id);

    const [clusterThoughts, proposals, experimentCheckins] = await Promise.all([
      clusterIds.length === 0
        ? Promise.resolve([])
        : admin.from("cluster_thoughts").select("*").in("cluster_id", clusterIds).then((r) => r.data ?? []),
      clusterIds.length === 0
        ? Promise.resolve([])
        : admin.from("proposals").select("*").in("cluster_id", clusterIds).then((r) => r.data ?? []),
      experimentIds.length === 0
        ? Promise.resolve([])
        : admin.from("experiment_checkins").select("*").in("experiment_id", experimentIds).then((r) => r.data ?? []),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      user_id: userIdText,
      schema_version: SCHEMA_VERSION,
      data: {
        journal_entries: journalEntries,
        thoughts,
        clusters,
        cluster_thoughts: clusterThoughts,
        proposals,
        experiments,
        experiment_checkins: experimentCheckins,
      },
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in export-user-data:", error);
    return new Response(
      JSON.stringify({
        error: "Service error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
