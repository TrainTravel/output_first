import { useState } from 'react';

export const QUOTES_ENABLED_KEY = 'outputfirst_quotes_enabled';
export const QUOTES_LAST_SHOWN_KEY = 'outputfirst_quotes_last_shown';

/** Snapshot of the persisted toggle. Defaults to true when absent. */
export function readQuotesEnabled(): boolean {
  const raw = localStorage.getItem(QUOTES_ENABLED_KEY);
  return raw === null ? true : raw !== 'false';
}

/**
 * Stateful read/write of the "show daily philosopher quote" preference.
 * Each consumer keeps its own React state; persistence is the source of
 * truth across screens (dialog and settings toggle never co-exist, so
 * stale-state coordination is not a concern in v1).
 */
export function useQuotesEnabled(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabledState] = useState<boolean>(readQuotesEnabled);
  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    try { localStorage.setItem(QUOTES_ENABLED_KEY, String(v)); } catch { /* quota / private mode */ }
  };
  return [enabled, setEnabled];
}
