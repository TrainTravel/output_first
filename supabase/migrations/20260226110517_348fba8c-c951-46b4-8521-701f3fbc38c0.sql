
-- Drop all insecure "anon" policies that use USING (true)
DROP POLICY IF EXISTS "Anon can view thoughts by anonymous id" ON public.thoughts;
DROP POLICY IF EXISTS "Anon can insert thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Anon can update thoughts" ON public.thoughts;

DROP POLICY IF EXISTS "Anon can view clusters" ON public.clusters;
DROP POLICY IF EXISTS "Anon can insert clusters" ON public.clusters;
DROP POLICY IF EXISTS "Anon can update clusters" ON public.clusters;

DROP POLICY IF EXISTS "Anon can view cluster thoughts" ON public.cluster_thoughts;
DROP POLICY IF EXISTS "Anon can insert cluster thoughts" ON public.cluster_thoughts;
DROP POLICY IF EXISTS "Anon can delete cluster thoughts" ON public.cluster_thoughts;
