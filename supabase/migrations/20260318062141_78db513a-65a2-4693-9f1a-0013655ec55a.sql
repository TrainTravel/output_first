
-- Experiments table
CREATE TABLE public.experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action text NOT NULL,
  duration text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  reflection_plus text,
  reflection_minus text,
  reflection_next text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own experiments" ON public.experiments
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own experiments" ON public.experiments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own experiments" ON public.experiments
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own experiments" ON public.experiments
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

-- Experiment check-ins table
CREATE TABLE public.experiment_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  date text NOT NULL,
  showed_up boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, date)
);

ALTER TABLE public.experiment_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON public.experiment_checkins
  FOR SELECT TO authenticated USING (experiment_id IN (SELECT id FROM public.experiments WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can insert own checkins" ON public.experiment_checkins
  FOR INSERT TO authenticated WITH CHECK (experiment_id IN (SELECT id FROM public.experiments WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can update own checkins" ON public.experiment_checkins
  FOR UPDATE TO authenticated USING (experiment_id IN (SELECT id FROM public.experiments WHERE user_id = auth.uid()::text))
  WITH CHECK (experiment_id IN (SELECT id FROM public.experiments WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can delete own checkins" ON public.experiment_checkins
  FOR DELETE TO authenticated USING (experiment_id IN (SELECT id FROM public.experiments WHERE user_id = auth.uid()::text));
