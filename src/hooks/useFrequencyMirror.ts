import { useCallback } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { useLanguage } from '@/contexts/LanguageContext';
import { profileKey } from './useProfileStorage';
import { EMOTION_VOCAB_KEY } from './useEmotionVocab';

/** Suffix used by useProfileStorage for the dismissal map. */
export const FREQ_MIRROR_DISMISS_KEY = 'freq_mirror_dismissed';

/** How many cumulative uses count as "over-used". */
export const USE_THRESHOLD = 5;
/** Lookback window — only consider words used at least once in the last N days. */
export const RECENCY_DAYS = 30;
/** How long a word is suppressed after the user dismisses its nudge. */
export const DISMISS_WINDOW_DAYS = 14;

/**
 * Words considered too vague — naming yourself with these repeatedly is the
 * "I'm just tired" autopilot we want to gently challenge.
 *
 * Inclusion criteria:
 *   - common but imprecise feeling states (`tired`, `sad`, `anxious`, `angry`)
 *   - non-words that masquerade as answers (`fine`, `okay`, `good`, `bad`)
 *   - dissociative shorthand (`numb`, `empty`)
 *
 * Why include words that aren't currently tracked by useEmotionVocab
 * (e.g. `fine`, `okay`, `stressed`)? Forward-compat — if future input
 * surfaces (chat, free-text emotion entry) feeds `markUsed` with these,
 * the mirror will Just Work without a schema change.
 *
 * Deliberately EXCLUDED from the spec's suggestion:
 *   - `stuck` → already specific (frustration sub-category, names a state)
 */
export const VAGUE_EMOTIONS: ReadonlySet<string> = new Set([
  // currently tracked + vague
  'tired', 'low', 'overwhelmed',
  // common vague placeholders (not yet tracked but forward-compat)
  'fine', 'okay', 'good', 'bad',
  // common-but-imprecise feeling states
  'stressed', 'sad', 'happy', 'angry', 'anxious',
  // numb-class
  'numb', 'empty',
]);

interface VocabState {
  encountered: string[];
  used: Record<string, number>;
  lastSeen: Record<string, string>;
}

export interface FrequencyMirrorPick {
  word: string;
  count: number;
}

function readJsonAt<T>(key: string, fallback: T): T {
  return pipe(
    O.fromNullable(localStorage.getItem(key)),
    O.flatMap(raw => {
      try { return O.some(JSON.parse(raw) as T); }
      catch { return O.none; }
    }),
    O.getOrElse(() => fallback),
  );
}

/**
 * Read the vocab state for a specific profile. Shares the same prefixed
 * storage key as `useEmotionVocab` — there is exactly one source of truth
 * per profile for emotion-vocab usage counts.
 */
function loadVocabFor(profileId: string): VocabState {
  return readJsonAt<VocabState>(
    profileKey(profileId, EMOTION_VOCAB_KEY),
    { encountered: [], used: {}, lastSeen: {} },
  );
}

function loadDismissalsFor(profileId: string): Record<string, string> {
  return readJsonAt<Record<string, string>>(
    profileKey(profileId, FREQ_MIRROR_DISMISS_KEY),
    {},
  );
}

function daysBetween(isoDate: string, now: Date): number {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return Infinity;
  return (now.getTime() - then) / (1000 * 60 * 60 * 24);
}

/**
 * Pure picker — given the current vocab state and dismissal state, returns
 * the top word that qualifies for a "you said this a lot" nudge, or null.
 *
 * Qualifying criteria (ALL must hold):
 *   1. cumulative use count >= USE_THRESHOLD
 *   2. last used within RECENCY_DAYS
 *   3. word is in VAGUE_EMOTIONS
 *   4. word is not in an active dismissal window
 *
 * Tie-break: highest count → most-recent lastSeen.
 */
export function pickOverUsedVagueWord(
  vocab: VocabState,
  dismissals: Record<string, string>,
  now: Date = new Date(),
): FrequencyMirrorPick | null {
  const candidates: FrequencyMirrorPick[] = [];

  for (const [word, count] of Object.entries(vocab.used)) {
    if (count < USE_THRESHOLD) continue;
    if (!VAGUE_EMOTIONS.has(word)) continue;

    const lastSeen = vocab.lastSeen[word];
    if (!lastSeen) continue;
    if (daysBetween(lastSeen, now) > RECENCY_DAYS) continue;

    const dismissedAt = dismissals[word];
    if (dismissedAt && daysBetween(dismissedAt, now) <= DISMISS_WINDOW_DAYS) continue;

    candidates.push({ word, count });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const aSeen = vocab.lastSeen[a.word] ?? '';
    const bSeen = vocab.lastSeen[b.word] ?? '';
    return bSeen.localeCompare(aSeen);
  });

  return candidates[0];
}

/**
 * Profile-scoped convenience wrapper. Reads both vocab and dismissal stores
 * for the given profile. Prefer `useFrequencyMirror()` from React components
 * — this function is for tests and other code paths where a hook is awkward.
 */
export function getOverUsedVagueWordForProfile(
  profileId: string,
  now: Date = new Date(),
): FrequencyMirrorPick | null {
  return pickOverUsedVagueWord(loadVocabFor(profileId), loadDismissalsFor(profileId), now);
}

/**
 * Record a dismissal of `word` for the DISMISS_WINDOW_DAYS suppression window,
 * scoped to a specific profile.
 */
export function dismissWordForProfile(
  profileId: string,
  word: string,
  now: Date = new Date(),
): void {
  const key = profileKey(profileId, FREQ_MIRROR_DISMISS_KEY);
  const dismissals = loadDismissalsFor(profileId);
  dismissals[word] = now.toISOString().split('T')[0] ?? '';
  try {
    localStorage.setItem(key, JSON.stringify(dismissals));
  } catch {
    /* quota / private mode — best effort */
  }
}

/**
 * React hook providing profile-aware accessors. Calls `useLanguage()` to
 * resolve the active profile id, so components don't have to thread it.
 */
export function useFrequencyMirror() {
  const { activeProfileId } = useLanguage();

  const getOverUsedVagueWord = useCallback(
    (now?: Date) => getOverUsedVagueWordForProfile(activeProfileId, now),
    [activeProfileId],
  );

  const dismissWord = useCallback(
    (word: string, now?: Date) => dismissWordForProfile(activeProfileId, word, now),
    [activeProfileId],
  );

  return { getOverUsedVagueWord, dismissWord };
}

/** Test helper — clear all dismissals across every profile. */
export function _clearDismissalsForTest(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.endsWith(`_${FREQ_MIRROR_DISMISS_KEY}`)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}
