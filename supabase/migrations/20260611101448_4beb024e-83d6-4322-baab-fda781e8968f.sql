
-- Pro waitlist — demand-signal collection for a future Pro tier.
--
-- A user picks any number of "what would matter most" features and may
-- (optionally) leave an email so we can notify them at launch. All rows
-- are insert-only from the client; nobody can read the aggregate except
-- the service role. RLS enforces that an authenticated user can only
-- insert a row tagged with their own auth.uid().

CREATE TABLE public.pro_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_anonymous_id TEXT NOT NULL,
  email TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  other_text TEXT,
  primary_lang TEXT,
  target_lang TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_pro_waitlist_user ON public.pro_waitlist(user_anonymous_id);
CREATE INDEX idx_pro_waitlist_submitted ON public.pro_waitlist(submitted_at DESC);

ALTER TABLE public.pro_waitlist ENABLE ROW LEVEL SECURITY;

-- An authenticated user can submit their own vote. Nothing else.
CREATE POLICY "Users can insert own pro_waitlist row" ON public.pro_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (user_anonymous_id = auth.uid()::text);

-- Service role can read everything for prioritization analysis.
CREATE POLICY "Service role full access pro_waitlist" ON public.pro_waitlist
  FOR ALL TO service_role USING (true);
