import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';

export type TTLDays = 7 | 14 | 30;

export interface CirculationSettings {
  receive_letters: boolean;
  share_letters: boolean;
  ttl_days: TTLDays;
}

const DEFAULT_SETTINGS: CirculationSettings = {
  receive_letters: false,
  share_letters: false,
  ttl_days: 14,
};

export interface UseCirculationSettings {
  settings: CirculationSettings;
  loading: boolean;
  error: string | null;
  update: (next: Partial<CirculationSettings>) => Promise<{ ok: boolean }>;
}

/**
 * Per-user opt-in preferences for the Circulation of Love. Row is created
 * lazily on first update so unaffected users never appear in the table.
 */
export function useCirculationSettings(): UseCirculationSettings {
  const userId = useUserId();
  const [settings, setSettings] = useState<CirculationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error: selectError } = await supabase
        .from('circulation_settings')
        .select('receive_letters, share_letters, ttl_days')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled) return;
      if (selectError) {
        setError(selectError.message);
      } else if (data) {
        setSettings({
          receive_letters: data.receive_letters,
          share_letters: data.share_letters,
          ttl_days: data.ttl_days as TTLDays,
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const update = useCallback(
    async (next: Partial<CirculationSettings>) => {
      const merged: CirculationSettings = { ...settings, ...next };
      // Optimistic update — keeps the toggle snappy. Roll back on failure.
      setSettings(merged);
      setError(null);
      const { error: upsertError } = await supabase
        .from('circulation_settings')
        .upsert({
          user_id: userId,
          ...merged,
          updated_at: new Date().toISOString(),
        });
      if (upsertError) {
        setError(upsertError.message);
        setSettings(settings);
        return { ok: false };
      }
      return { ok: true };
    },
    [settings, userId],
  );

  return { settings, loading, error, update };
}
