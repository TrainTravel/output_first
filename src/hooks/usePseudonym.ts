import { useCallback, useMemo, useState } from 'react';
import { pickPseudonym, type PseudonymLang } from '@/lib/pseudonyms';

/**
 * Returns a pseudonym for the current draft. Deterministic on
 * `(language, seed, regenCount)` — so a re-render on the same draft is
 * stable, but the author can swap it ONCE via `regenerate()`.
 *
 * Spec says: regenerable ONCE before posting, never after. We enforce
 * the "once" cap here; the calling screen disables the button after.
 */
export function usePseudonym(language: PseudonymLang, seed: string) {
  const [regenCount, setRegenCount] = useState(0);

  const pseudonym = useMemo(
    () => pickPseudonym(language, `${seed}::${regenCount}`),
    [language, seed, regenCount],
  );

  const canRegenerate = regenCount < 1;
  const regenerate = useCallback(() => {
    setRegenCount(c => (c < 1 ? c + 1 : c));
  }, []);

  return { pseudonym, regenerate, canRegenerate };
}
