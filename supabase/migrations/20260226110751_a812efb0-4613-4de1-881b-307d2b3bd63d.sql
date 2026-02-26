
-- The existing "Users can insert own thoughts" policy requires user_anonymous_id = auth.uid()::text
-- which works for anonymous-auth users. No changes needed there.

-- Recreate proposals policies (they were dropped and re-created in the previous attempt but 
-- the tool only ran the DROP part). Let's verify and recreate:
DROP POLICY IF EXISTS "Users can insert own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view own proposals" ON public.proposals;

CREATE POLICY "Users can insert own proposals"
  ON public.proposals FOR INSERT
  WITH CHECK (cluster_id IN (
    SELECT id FROM public.clusters WHERE user_anonymous_id = auth.uid()::text
  ));

CREATE POLICY "Users can view own proposals"
  ON public.proposals FOR SELECT
  USING (cluster_id IN (
    SELECT id FROM public.clusters WHERE user_anonymous_id = auth.uid()::text
  ));
