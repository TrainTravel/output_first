import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

const VOCAB_KEY = 'outputfirst_emotion_vocab';
const DISMISS_KEY = 'outputfirst_freq_mirror_dismissed';

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

function loadVocab(): VocabState {
  return pipe(
    O.fromNullable(localStorage.getItem(VOCAB_KEY)),
    O.flatMap(raw => {
      try { return O.some(JSON.parse(raw) as VocabState); }
      catch { return O.none; }
    }),
    O.getOrElse((): VocabState => ({ encountered: [], used: {}, lastSeen: {} })),
  );
}

function loadDismissals(): Record<string, string> {
  return pipe(
    O.fromNullable(localStorage.getItem(DISMISS_KEY)),
    O.flatMap(raw => {
      try { return O.some(JSON.parse(raw) as Record<string, string>); }
      catch { return O.none; }
    }),
    O.getOrElse((): Record<string, string> => ({})),
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

/** Convenience wrapper that reads both stores from localStorage. */
export function getOverUsedVagueWord(now: Date = new Date()): FrequencyMirrorPick | null {
  return pickOverUsedVagueWord(loadVocab(), loadDismissals(), now);
}

/** Record a dismissal of `word` for the DISMISS_WINDOW_DAYS suppression window. */
export function dismissWord(word: string, now: Date = new Date()): void {
  const dismissals = loadDismissals();
  dismissals[word] = now.toISOString().split('T')[0] ?? '';
  localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissals));
}

/** Test helper — clear all dismissals. */
export function _clearDismissalsForTest(): void {
  localStorage.removeItem(DISMISS_KEY);
}
