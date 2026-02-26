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
 * 
 * This is the ONLY approved way to get a user ID in the app.
 * ESLint will flag any direct `user.id` or `user?.id` access.
 */
export function useUserId(): string {
  const { user } = useAuth();
  // eslint-disable-next-line no-restricted-syntax -- this is the canonical source
  return user?.id ?? getOrCreateAnonId();
}
