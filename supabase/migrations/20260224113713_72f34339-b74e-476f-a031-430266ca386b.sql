
-- Enable RLS on all tables
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Thoughts: users can only access their own
CREATE POLICY "Users can view own thoughts" ON thoughts FOR SELECT TO authenticated
  USING (user_anonymous_id = auth.uid()::text);
CREATE POLICY "Users can insert own thoughts" ON thoughts FOR INSERT TO authenticated
  WITH CHECK (user_anonymous_id = auth.uid()::text);
CREATE POLICY "Users can update own thoughts" ON thoughts FOR UPDATE TO authenticated
  USING (user_anonymous_id = auth.uid()::text)
  WITH CHECK (user_anonymous_id = auth.uid()::text);
CREATE POLICY "Users can delete own thoughts" ON thoughts FOR DELETE TO authenticated
  USING (user_anonymous_id = auth.uid()::text);

-- Allow service role full access for edge functions
CREATE POLICY "Service role full access thoughts" ON thoughts FOR ALL TO service_role USING (true);

-- Clusters: users can only access their own
CREATE POLICY "Users can view own clusters" ON clusters FOR SELECT TO authenticated
  USING (user_anonymous_id = auth.uid()::text);
CREATE POLICY "Users can insert own clusters" ON clusters FOR INSERT TO authenticated
  WITH CHECK (user_anonymous_id = auth.uid()::text);
CREATE POLICY "Users can update own clusters" ON clusters FOR UPDATE TO authenticated
  USING (user_anonymous_id = auth.uid()::text)
  WITH CHECK (user_anonymous_id = auth.uid()::text);
CREATE POLICY "Users can delete own clusters" ON clusters FOR DELETE TO authenticated
  USING (user_anonymous_id = auth.uid()::text);

-- Cluster thoughts: access via cluster ownership
CREATE POLICY "Users can view own cluster thoughts" ON cluster_thoughts FOR SELECT TO authenticated
  USING (cluster_id IN (SELECT id FROM clusters WHERE user_anonymous_id = auth.uid()::text));
CREATE POLICY "Users can insert own cluster thoughts" ON cluster_thoughts FOR INSERT TO authenticated
  WITH CHECK (cluster_id IN (SELECT id FROM clusters WHERE user_anonymous_id = auth.uid()::text));
CREATE POLICY "Users can delete own cluster thoughts" ON cluster_thoughts FOR DELETE TO authenticated
  USING (cluster_id IN (SELECT id FROM clusters WHERE user_anonymous_id = auth.uid()::text));

-- Proposals: access via cluster ownership
CREATE POLICY "Users can view own proposals" ON proposals FOR SELECT TO authenticated
  USING (cluster_id IN (SELECT id FROM clusters WHERE user_anonymous_id = auth.uid()::text));
CREATE POLICY "Users can insert own proposals" ON proposals FOR INSERT TO authenticated
  WITH CHECK (cluster_id IN (SELECT id FROM clusters WHERE user_anonymous_id = auth.uid()::text));

-- Update match_thoughts to use auth.uid() instead of client-provided parameter
CREATE OR REPLACE FUNCTION public.match_thoughts(
  query_embedding extensions.vector,
  similarity_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 20,
  p_user_anonymous_id text DEFAULT ''::text
)
RETURNS TABLE(id uuid, content text, created_at timestamp with time zone, ai_theme text, archived boolean, composted boolean, user_anonymous_id text, similarity double precision)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.content,
    t.created_at,
    t.ai_theme,
    t.archived,
    t.composted,
    t.user_anonymous_id,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM public.thoughts t
  WHERE
    t.user_anonymous_id = auth.uid()::text
    AND t.archived = false
    AND t.composted = false
    AND t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> query_embedding) > similarity_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Update compost_and_fetch_thoughts to use auth.uid()
CREATE OR REPLACE FUNCTION public.compost_and_fetch_thoughts(p_user_anonymous_id text)
RETURNS SETOF thoughts
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.thoughts
  SET composted = true
  WHERE user_anonymous_id = auth.uid()::text
    AND composted = false
    AND archived = false
    AND created_at < now() - interval '14 days'
    AND id NOT IN (SELECT thought_id FROM public.cluster_thoughts);

  RETURN QUERY
  SELECT *
  FROM public.thoughts
  WHERE user_anonymous_id = auth.uid()::text
    AND archived = false
    AND composted = false
  ORDER BY created_at DESC;
END;
$$;
