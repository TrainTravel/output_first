
-- Fix search_path for match_thoughts function
CREATE OR REPLACE FUNCTION public.match_thoughts(
  query_embedding vector(768),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20,
  p_user_anonymous_id text DEFAULT ''
)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  ai_theme text,
  archived boolean,
  composted boolean,
  user_anonymous_id text,
  similarity float
)
LANGUAGE plpgsql
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
    t.user_anonymous_id = p_user_anonymous_id
    AND t.archived = false
    AND t.composted = false
    AND t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> query_embedding) > similarity_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
