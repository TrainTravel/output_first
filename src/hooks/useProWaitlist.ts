import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProWaitlistFeature } from '@/types/journal';
import { useProfileStorage } from '@/hooks/useProfileStorage';

/**
 * Local-only flag — persisted per profile so a re-login on the same device
 * doesn't ask again, and a different profile sharing the device still gets
 * to be asked. Stored as the ISO timestamp of submission to make ad-hoc
 * audits trivial later.
 */
const SUBMITTED_KEY = 'prowaitlist_submitted_at';

export interface ProWaitlistSubmission {
  features: ProWaitlistFeature[];
  otherText?: string;
  email?: string;
}

export interface UseProWaitlist {
  submitted: boolean;
  submittedAt: string | null;
  loading: boolean;
  error: string | null;
  submit: (input: ProWaitlistSubmission) => Promise<{ ok: boolean }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw?: string): string | undefined {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return undefined;
  return EMAIL_RE.test(trimmed) ? trimmed : undefined;
}

export function useProWaitlist(): UseProWaitlist {
  const userId = useUserId();
  const { primaryLang, targetLang } = useLanguage();
  const [submittedAt, setSubmittedAt] = useProfileStorage<string | null>(SUBMITTED_KEY, null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset transient state on userId change (e.g. profile switch).
  useEffect(() => {
    setLoading(false);
    setError(null);
  }, [userId]);

  const submit = useCallback(
    async ({ features, otherText, email }: ProWaitlistSubmission) => {
      setLoading(true);
      setError(null);
      try {
        const normalizedEmail = normalizeEmail(email);
        const trimmedOther = otherText?.trim();
        const { error: insertError } = await supabase.from('pro_waitlist').insert({
          user_anonymous_id: userId,
          email: normalizedEmail ?? null,
          features,
          other_text: trimmedOther && trimmedOther.length > 0 ? trimmedOther : null,
          primary_lang: primaryLang,
          target_lang: targetLang,
        });
        if (insertError) {
          // Persist locally even on insert failure: the user clearly intended
          // to vote, and we don't want the CTA to keep haunting them. The
          // error toast surfaces the failure to the human in the same render.
          setError(insertError.message);
          setSubmittedAt(new Date().toISOString());
          return { ok: false };
        }
        setSubmittedAt(new Date().toISOString());
        return { ok: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setSubmittedAt(new Date().toISOString());
        return { ok: false };
      } finally {
        setLoading(false);
      }
    },
    [userId, primaryLang, targetLang, setSubmittedAt],
  );

  return {
    submitted: submittedAt !== null,
    submittedAt,
    loading,
    error,
    submit,
  };
}
