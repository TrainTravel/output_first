CREATE TABLE public.pro_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_anonymous_id text NOT NULL,
  email text,
  features text[] NOT NULL DEFAULT '{}',
  other_text text,
  primary_lang text,
  target_lang text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pro_waitlist TO authenticated;
GRANT ALL ON public.pro_waitlist TO service_role;

ALTER TABLE public.pro_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own waitlist entry"
  ON public.pro_waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (user_anonymous_id = auth.uid()::text);

CREATE POLICY "Users can view their own waitlist entries"
  ON public.pro_waitlist
  FOR SELECT
  TO authenticated
  USING (user_anonymous_id = auth.uid()::text);