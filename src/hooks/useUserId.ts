import { useAuth } from '@/contexts/AuthContext';

const ANON_KEY = 'outputfirst_anon_id';

function getOrCreateAnonId(): string {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

/**
 * Returns a stable user ID: the authenticated user's ID if logged in,
 * otherwise a persistent anonymous ID from localStorage.
 */
export function useUserId(): string {
  const { user } = useAuth();
  return user?.id ?? getOrCreateAnonId();
}
