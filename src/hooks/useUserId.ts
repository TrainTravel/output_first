import { useAuth } from '@/contexts/AuthContext';

/**
 * Returns the authenticated user's ID (works for both anonymous-auth
 * and email-auth users since both get a real auth.uid()).
 *
 * This is the ONLY approved way to get a user ID in the app.
 */
export function useUserId(): string {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useUserId called before auth initialised');
  }
  return user.id;
}
