
CREATE OR REPLACE FUNCTION public.migrate_anonymous_data(old_anon_id text, new_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.thoughts SET user_anonymous_id = new_user_id WHERE user_anonymous_id = old_anon_id;
  UPDATE public.clusters SET user_anonymous_id = new_user_id WHERE user_anonymous_id = old_anon_id;
END;
$$;
