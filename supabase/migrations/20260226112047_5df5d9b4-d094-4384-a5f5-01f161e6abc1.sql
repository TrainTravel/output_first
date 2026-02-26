
CREATE OR REPLACE FUNCTION public.claim_all_thoughts(new_user_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.thoughts SET user_anonymous_id = new_user_id WHERE user_anonymous_id <> new_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  UPDATE public.clusters SET user_anonymous_id = new_user_id WHERE user_anonymous_id <> new_user_id;
  
  RETURN updated_count;
END;
$$;
