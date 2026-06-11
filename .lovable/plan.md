## Two things to do

### 1. Fix the build errors in `src/hooks/useProWaitlist.ts`

The hook inserts into `pro_waitlist`, but that table doesn't exist in the DB (it's not in the generated types, hence the `"pro_waitlist" is not assignable to parameter of type 'never'"` errors). Two options:

- **(a) Create the table** via migration with columns: `id uuid pk`, `user_anonymous_id text not null`, `email text`, `features text[] not null`, `other_text text`, `primary_lang text`, `target_lang text`, `created_at timestamptz default now()`. Enable RLS + `GRANT` for `authenticated`/`service_role` + insert-own policy. Types regenerate and both errors clear.
- **(b) Remove/stub the hook** if the Pro Waitlist feature isn't wanted yet — write to `localStorage` only and drop the Supabase insert.

I recommend **(a)** since the hook is wired into `ProWaitlistScreen` and clearly intended to capture real submissions.

### 2. Debug the `todo-triage` priority-quadrant flow

The function was just redeployed and the eisenhower branch is live (verified — returns 401 on unauthed curl rather than the old `"task must be 1-500 chars"`). Next-step debugging:

- Reproduce in preview as a logged-in user: Brain Dump → add 2 thoughts → tap "Trier en quadrants".
- Pull `supabase--edge_function_logs` for `todo-triage` filtered on `eisenhower` / `error` to see the real-time outcome.
- Check the network response body in the preview to confirm the response now has a `classifications` array.
- If it still 400s, inspect the request payload shape vs. the validator in `index.ts` (items array, each with id+content 1–500 chars).

Plan: do step 1 first (unblocks the build), then run step 2.
