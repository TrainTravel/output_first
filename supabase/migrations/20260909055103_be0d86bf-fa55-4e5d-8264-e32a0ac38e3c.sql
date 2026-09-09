CREATE TABLE public.tiny_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  original_step text NOT NULL,
  final_step text NOT NULL,
  initial_confidence integer NOT NULL,
  final_confidence integer NOT NULL,
  source text NOT NULL DEFAULT 'home',
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiny_steps TO authenticated;
GRANT ALL ON public.tiny_steps TO service_role;

ALTER TABLE public.tiny_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tiny steps" ON public.tiny_steps
  FOR SELECT TO authenticated USING (user_id = (auth.uid())::text);
CREATE POLICY "Users can insert own tiny steps" ON public.tiny_steps
  FOR INSERT TO authenticated WITH CHECK (user_id = (auth.uid())::text);
CREATE POLICY "Users can update own tiny steps" ON public.tiny_steps
  FOR UPDATE TO authenticated USING (user_id = (auth.uid())::text) WITH CHECK (user_id = (auth.uid())::text);
CREATE POLICY "Users can delete own tiny steps" ON public.tiny_steps
  FOR DELETE TO authenticated USING (user_id = (auth.uid())::text);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tiny_steps_updated_at
  BEFORE UPDATE ON public.tiny_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();