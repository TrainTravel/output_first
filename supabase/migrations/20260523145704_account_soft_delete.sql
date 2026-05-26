-- GDPR Article 17 (right to erasure) — 30-day soft-delete grace period.
--
-- We create a minimal `profiles` table (1 row per auth.users row) that stores
-- the optional `scheduled_deletion_at` timestamp. We deliberately avoid mutating
-- auth.users.raw_user_meta_data so this column stays queryable via RLS and is
-- easy to migrate / index later.
--
-- A user can:
--   1. Schedule deletion → scheduled_deletion_at = now() + 30 days
--   2. Cancel deletion   → scheduled_deletion_at = NULL
--   3. After 30 days     → hard delete purges all rows tagged with the user_id
--                          (v1 limitation: hard delete is triggered lazily on
--                          next sign-in; production should wire a pg_cron job).

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_deletion_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- A user can read only their own profile row.
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- A user can update only their own profile row (covers cancel-deletion).
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- A user can insert their own profile row (lazy creation on first read).
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Index to allow a future cron job to find expired rows efficiently.
CREATE INDEX IF NOT EXISTS idx_profiles_scheduled_deletion_at
  ON public.profiles(scheduled_deletion_at)
  WHERE scheduled_deletion_at IS NOT NULL;
