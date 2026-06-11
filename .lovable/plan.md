## Redeploy `todo-triage` edge function

The local `supabase/functions/todo-triage/index.ts` already contains the `mode: 'eisenhower'` branch (PR #74), but the deployed version is stale and falls through to the ABC branch, returning `"task must be 1-500 chars"` when the Brain Dump → Quadrants flow calls it.

### Steps

1. Call `supabase--deploy_edge_functions` with `function_names: ["todo-triage"]` to push the current source live (Lovable's equivalent of `supabase functions deploy`).
2. Verify with `supabase--curl_edge_functions` — POST to `/todo-triage` with a small `{ mode: 'eisenhower', items: [{id, content}], primaryLang: 'en' }` payload and confirm we get back a `classifications` array instead of the `INVALID_INPUT` error.
3. If verification fails, check `supabase--edge_function_logs` for `todo-triage` to diagnose.

No code changes — this is a deploy-only operation.
