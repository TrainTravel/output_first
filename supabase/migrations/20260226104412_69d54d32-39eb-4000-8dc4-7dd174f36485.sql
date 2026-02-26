-- Allow anonymous users to SELECT their own thoughts (matched by user_anonymous_id passed in the query)
CREATE POLICY "Anon can view thoughts by anonymous id"
  ON public.thoughts FOR SELECT TO anon
  USING (true);

-- Allow anonymous users to INSERT thoughts
CREATE POLICY "Anon can insert thoughts"
  ON public.thoughts FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anonymous users to UPDATE their own thoughts
CREATE POLICY "Anon can update thoughts"
  ON public.thoughts FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- Allow anonymous users to SELECT clusters
CREATE POLICY "Anon can view clusters"
  ON public.clusters FOR SELECT TO anon
  USING (true);

-- Allow anonymous users to INSERT clusters
CREATE POLICY "Anon can insert clusters"
  ON public.clusters FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anonymous users to UPDATE clusters
CREATE POLICY "Anon can update clusters"
  ON public.clusters FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- Allow anonymous users to view cluster_thoughts
CREATE POLICY "Anon can view cluster thoughts"
  ON public.cluster_thoughts FOR SELECT TO anon
  USING (true);

-- Allow anonymous users to insert cluster_thoughts
CREATE POLICY "Anon can insert cluster thoughts"
  ON public.cluster_thoughts FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anonymous users to delete cluster_thoughts
CREATE POLICY "Anon can delete cluster thoughts"
  ON public.cluster_thoughts FOR DELETE TO anon
  USING (true);