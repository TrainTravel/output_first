
-- Auto-compost thoughts older than 14 days that are NOT linked to any cluster
CREATE OR REPLACE FUNCTION public.auto_compost_old_thoughts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.thoughts
  SET composted = true
  WHERE composted = false
    AND archived = false
    AND created_at < now() - interval '14 days'
    AND id NOT IN (SELECT thought_id FROM public.cluster_thoughts);
  RETURN NULL;
END;
$$;

-- Run auto-compost on every SELECT from thoughts (lightweight, runs periodically)
-- Better approach: run it before fetching via a simple RPC
CREATE OR REPLACE FUNCTION public.compost_and_fetch_thoughts(p_user_anonymous_id text)
RETURNS SETOF public.thoughts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-compost old unlinked thoughts for this user
  UPDATE public.thoughts
  SET composted = true
  WHERE user_anonymous_id = p_user_anonymous_id
    AND composted = false
    AND archived = false
    AND created_at < now() - interval '14 days'
    AND id NOT IN (SELECT thought_id FROM public.cluster_thoughts);

  -- Return active thoughts
  RETURN QUERY
  SELECT *
  FROM public.thoughts
  WHERE user_anonymous_id = p_user_anonymous_id
    AND archived = false
    AND composted = false
  ORDER BY created_at DESC;
END;
$$;
