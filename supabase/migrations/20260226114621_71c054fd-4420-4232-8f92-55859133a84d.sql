
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_anonymous_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  would_pay text NOT NULL DEFAULT 'no',
  price_range text DEFAULT NULL,
  platform_preference text DEFAULT 'web',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (user_anonymous_id = (auth.uid())::text);

CREATE POLICY "No one can read feedback via API"
  ON public.feedback
  FOR SELECT
  USING (false);
