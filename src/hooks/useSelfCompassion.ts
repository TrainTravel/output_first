import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { COMPASSION_PHRASES, NeffStep } from '@/data/compassionPhrases';
import type { Language } from '@/contexts/LanguageContext';

type CompassionLang = 'fr' | 'en' | 'es';
const COMPASSION_LANGS: ReadonlySet<string> = new Set(['fr', 'en', 'es']);

// Chinese (zh-Hans/zh-Hant) translations don't exist yet; fall back to en
// so the seed/practice still renders for primary=zh-* users.
function asCompassionLang(lang: Language): CompassionLang {
  return COMPASSION_LANGS.has(lang) ? (lang as CompassionLang) : 'en';
}

const HARD_EMOTIONS = new Set([
  'tired', 'weary', 'drained', 'low', 'overwhelmed', 'burdened',       // Heavy
  'nervous', 'apprehensive', 'on-edge', 'scattered', 'uneasy', 'panicked', // Anxious
  'irritated', 'impatient', 'stuck', 'restless', 'exasperated', 'defeated', // Frustrated
]);

const SEED_KEY = 'outputfirst_compassion_seed_dismissed'; // stores "yyyy-MM-dd"

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getDailyStep(date?: Date): NeffStep {
  return (getDayOfYear(date ?? new Date()) % 3) as NeffStep;
}

export function getDailyPhrase(step: NeffStep, lang: Language, date?: Date): string {
  const dayOfYear = getDayOfYear(date ?? new Date());
  return COMPASSION_PHRASES[step].phrases[asCompassionLang(lang)][dayOfYear % 8];
}

export function getDailyStepLabel(step: NeffStep, lang: Language): string {
  return COMPASSION_PHRASES[step].label[asCompassionLang(lang)];
}

export function isStruggling(emotions?: string): boolean {
  if (!emotions || emotions.trim() === '') return false;
  return emotions
    .toLowerCase()
    .split(/[,\s]+/)
    .some(w => w.length > 0 && HARD_EMOTIONS.has(w));
}

export function isSeedDismissedToday(): boolean {
  const today = new Date().toISOString().split('T')[0];
  return pipe(
    O.fromNullable(localStorage.getItem(SEED_KEY)),
    O.exists(stored => stored === today),
  );
}

export function dismissSeedToday(): void {
  localStorage.setItem(SEED_KEY, new Date().toISOString().split('T')[0] ?? '');
}
