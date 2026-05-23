import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

export type TargetLang = 'fr' | 'es' | 'zh-Hans' | 'zh-Hant';
export type PrimaryLang = 'en' | 'fr' | 'es' | 'zh-Hans' | 'zh-Hant';
export type Language = TargetLang | PrimaryLang;

export interface LangPair {
  primary: PrimaryLang;
  target: TargetLang;
}

const TARGET_LANGS: readonly TargetLang[] = ['fr', 'es', 'zh-Hans', 'zh-Hant'];
const PRIMARY_LANGS: readonly PrimaryLang[] = ['en', 'fr', 'es', 'zh-Hans', 'zh-Hant'];

export const DEFAULT_PAIR: LangPair = { primary: 'en', target: 'fr' };
const STORAGE_KEY = 'outputfirst_lang_pair';

interface LanguageContextType {
  pair: LangPair;
  targetLang: TargetLang;
  primaryLang: PrimaryLang;
  setLangPair: (next: LangPair) => void;
  /** Cheap one-tap flip: cycles primaryLang through valid options (skips target). */
  toggleLanguage: () => void;
  /** Available primary options that don't conflict with the current target. */
  availablePrimaries: readonly PrimaryLang[];
  /** Available target options that don't conflict with the current primary. */
  availableTargets: readonly TargetLang[];
  /** Returns { primary: target-language string, secondary: primary-language string }. */
  t: (fr: string, en: string, es: string, zhHans?: string, zhHant?: string) => { primary: string; secondary: string };
  /** Returns "{target-string} / {primary-string}". */
  bilingual: (fr: string, en: string, es: string, zhHans?: string, zhHant?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function isTargetLang(v: unknown): v is TargetLang {
  return typeof v === 'string' && (TARGET_LANGS as readonly string[]).includes(v);
}

function isPrimaryLang(v: unknown): v is PrimaryLang {
  return typeof v === 'string' && (PRIMARY_LANGS as readonly string[]).includes(v);
}

function validatePair(raw: unknown): LangPair {
  if (!raw || typeof raw !== 'object') return DEFAULT_PAIR;
  const obj = raw as Record<string, unknown>;
  if (!isPrimaryLang(obj.primary) || !isTargetLang(obj.target)) return DEFAULT_PAIR;
  if ((obj.primary as string) === (obj.target as string)) return DEFAULT_PAIR;
  return { primary: obj.primary, target: obj.target };
}

function hydrate(): LangPair {
  return pipe(
    O.fromNullable(localStorage.getItem(STORAGE_KEY)),
    O.flatMap(raw => {
      try { return O.some(JSON.parse(raw) as unknown); }
      catch { return O.none; }
    }),
    O.map(validatePair),
    O.getOrElse((): LangPair => DEFAULT_PAIR),
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [pair, setPairState] = useState<LangPair>(hydrate);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pair));
  }, [pair]);

  const setLangPair = (next: LangPair) => {
    if ((next.primary as string) !== (next.target as string)) {
      setPairState(next);
      return;
    }
    // Conflict: swap-or-fallback so the invariant always holds at every render.
    const primaryChanged = next.primary !== pair.primary;
    if (primaryChanged) {
      const oldPrimary = pair.primary;
      const swapped: TargetLang = isTargetLang(oldPrimary)
        ? oldPrimary
        : (TARGET_LANGS.find(t => (t as string) !== (next.primary as string)) as TargetLang);
      setPairState({ primary: next.primary, target: swapped });
    } else {
      const oldTarget = pair.target;
      const swapped: PrimaryLang = isPrimaryLang(oldTarget)
        ? oldTarget
        : (PRIMARY_LANGS.find(p => (p as string) !== (next.target as string)) as PrimaryLang);
      setPairState({ primary: swapped, target: next.target });
    }
  };

  const toggleLanguage = () => {
    const idx = PRIMARY_LANGS.indexOf(pair.primary);
    for (let i = 1; i <= PRIMARY_LANGS.length; i++) {
      const candidate = PRIMARY_LANGS[(idx + i) % PRIMARY_LANGS.length];
      if ((candidate as string) !== (pair.target as string)) {
        setPairState({ ...pair, primary: candidate });
        return;
      }
    }
  };

  const availablePrimaries = PRIMARY_LANGS.filter(p => (p as string) !== (pair.target as string));
  const availableTargets = TARGET_LANGS.filter(t => (t as string) !== (pair.primary as string));

  const stringFor = (
    lang: Language,
    fr: string, en: string, es: string,
    zhHans?: string, zhHant?: string,
  ): string => {
    switch (lang) {
      case 'fr': return fr;
      case 'en': return en;
      case 'es': return es;
      case 'zh-Hans': return zhHans || en;
      case 'zh-Hant': return zhHant || en;
    }
  };

  const t = (fr: string, en: string, es: string, zhHans?: string, zhHant?: string) => ({
    primary: stringFor(pair.target, fr, en, es, zhHans, zhHant),
    secondary: stringFor(pair.primary, fr, en, es, zhHans, zhHant),
  });

  const bilingual = (fr: string, en: string, es: string, zhHans?: string, zhHant?: string) => {
    const tgt = stringFor(pair.target, fr, en, es, zhHans, zhHant);
    const prm = stringFor(pair.primary, fr, en, es, zhHans, zhHant);
    return `${tgt} / ${prm}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        pair,
        targetLang: pair.target,
        primaryLang: pair.primary,
        setLangPair,
        toggleLanguage,
        availablePrimaries,
        availableTargets,
        t,
        bilingual,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
