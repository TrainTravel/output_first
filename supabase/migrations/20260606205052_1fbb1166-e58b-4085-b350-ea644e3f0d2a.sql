REVOKE EXECUTE ON FUNCTION public.migrate_anonymous_data(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_compost_old_thoughts() FROM PUBLIC, anon, authenticated;