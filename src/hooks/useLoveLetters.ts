import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PseudonymLang } from '@/lib/pseudonyms';

export type ModerationVerdict = 'pass' | 'softfail' | 'block';
export type ModeratedStatus = 'pending' | 'passed' | 'softfailed' | 'blocked';

export interface LoveLetter {
  id: string;
  author_id: string;
  content: string;
  language: PseudonymLang;
  pseudonym: string;
  moderated_status: ModeratedStatus;
  moderation_note: string | null;
  posted_at: string | null;
  expires_at: string | null;
  archived: boolean;
  created_at: string;
}

export interface ShareResult {
  ok: boolean;
  verdict: ModerationVerdict | null;
  note: string | null;
  letter: LoveLetter | null;
}

export interface UseLoveLetters {
  current: LoveLetter[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  share: (input: { content: string; pseudonym: string; ttl_days: 7 | 14 | 30 }) => Promise<ShareResult>;
  hold: (letterId: string) => Promise<{ ok: boolean }>;
  unhold: (letterId: string) => Promise<{ ok: boolean }>;
}

/**
 * Reads, shares, and reacts to letters in the user's primary language. RLS
 * enforces the language filter and opt-in gate — we just trust what comes
 * back, and surface DB errors plainly.
 */
export function useLoveLetters(): UseLoveLetters {
  const userId = useUserId();
  const { primaryLang } = useLanguage();
  const [current, setCurrent] = useState<LoveLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    // RLS enforces opt-in + passed + live. We filter by language and archived
    // here as client-side guards (defense-in-depth).
    const { data, error: selectError } = await supabase
      .from('love_letters')
      .select('*')
      .eq('language', primaryLang)
      .eq('archived', false)
      .order('posted_at', { ascending: false })
      .limit(50);
    if (selectError) {
      setError(selectError.message);
      setLoading(false);
      return;
    }
    setCurrent((data ?? []) as LoveLetter[]);
    setLoading(false);
  }, [primaryLang]);

  useEffect(() => {
    refresh();
  }, [refresh, primaryLang, userId]);

  const share = useCallback(
    async ({ content, pseudonym, ttl_days }: { content: string; pseudonym: string; ttl_days: 7 | 14 | 30 }) => {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke('moderate-letter', {
        body: { content, language: primaryLang, pseudonym, ttl_days },
      });
      if (fnError) {
        setError(fnError.message);
        return { ok: false, verdict: null, note: null, letter: null };
      }
      const result = data as { letter: LoveLetter; verdict: ModerationVerdict; note: string | null };
      if (result.verdict === 'pass') {
        // Optimistic prepend — refresh kicks shortly after.
        setCurrent(prev => [result.letter, ...prev]);
      }
      return { ok: true, verdict: result.verdict, note: result.note, letter: result.letter };
    },
    [primaryLang],
  );

  const hold = useCallback(
    async (letterId: string) => {
      const { error: insertError } = await supabase
        .from('letter_holdings')
        .insert({ letter_id: letterId, holder_id: userId });
      // Duplicate key is fine (idempotent) — Supabase surfaces it as code 23505.
      if (insertError && insertError.code !== '23505') {
        setError(insertError.message);
        return { ok: false };
      }
      return { ok: true };
    },
    [userId],
  );

  const unhold = useCallback(
    async (letterId: string) => {
      const { error: deleteError } = await supabase
        .from('letter_holdings')
        .delete()
        .eq('letter_id', letterId)
        .eq('holder_id', userId);
      if (deleteError) {
        setError(deleteError.message);
        return { ok: false };
      }
      return { ok: true };
    },
    [userId],
  );

  return { current, loading, error, refresh, share, hold, unhold };
}
