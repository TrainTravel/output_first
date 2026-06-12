import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

export type TargetLang = 'fr' | 'es' | 'zh-Hans' | 'zh-Hant' | 'ja';
export type PrimaryLang = 'en' | 'fr' | 'es' | 'zh-Hans' | 'zh-Hant' | 'ja';
export type Language = TargetLang | PrimaryLang;

export interface LangPair {
  primary: PrimaryLang;
  target: TargetLang;
}

/**
 * A learning profile = a course identity (the target language being learned).
 * The chrome language (`primary`) is a global app-wide preference and does NOT
 * live on Profile — switching profiles must not silently mutate chrome.
 */
export interface Profile {
  id: string;
  target: TargetLang;
  createdAt: string;
  name?: string;
  archivedAt?: string;
}

const TARGET_LANGS: readonly TargetLang[] = ['fr', 'es', 'zh-Hans', 'zh-Hant', 'ja'];
const PRIMARY_LANGS: readonly PrimaryLang[] = ['en', 'fr', 'es', 'zh-Hans', 'zh-Hant', 'ja'];

export const DEFAULT_PAIR: LangPair = { primary: 'en', target: 'fr' };
export const DEFAULT_PROFILE_ID = 'default';

const PROFILES_STORAGE_KEY = 'outputfirst_profiles';
const LEGACY_PAIR_STORAGE_KEY = 'outputfirst_lang_pair';

export interface Translations {
  fr: string;
  en: string;
  es: string;
  'zh-Hans'?: string;
  'zh-Hant'?: string;
  ja?: string;
}

interface ProfilesState {
  profiles: Profile[];
  activeProfileId: string;
  /** Global chrome language. Unaffected by profile switches. */
  primaryLang: PrimaryLang;
  /** All languages the user has marked as "already speak". Invariants:
   *   - non-empty
   *   - contains `primaryLang`
   *   - excludes the active profile's `target`
   */
  knownLangs: PrimaryLang[];
}

interface LanguageContextType {
  pair: LangPair;
  targetLang: TargetLang;
  primaryLang: PrimaryLang;
  setLangPair: (next: LangPair) => void;
  toggleLanguage: () => void;
  availablePrimaries: readonly PrimaryLang[];
  availableTargets: readonly TargetLang[];
  t: (translations: Translations) => { primary: string; secondary: string };
  bilingual: (translations: Translations) => string;

  // Known-languages (multi-select) API.
  knownLangs: readonly PrimaryLang[];
  toggleKnownLang: (lang: PrimaryLang) => void;
  setKnownLangs: (next: PrimaryLang[]) => void;

  profiles: readonly Profile[];
  activeProfileId: string;
  createProfile: (input: { target: TargetLang; name?: string }) => Profile;
  switchProfile: (id: string) => void;
  archiveProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const _fallbackSeen = new Set<string>();
export function warnFallback(lang: 'ja' | 'zh-Hans' | 'zh-Hant', enValue: string): string {
  if (import.meta.env.DEV) {
    const key = `${lang}::${enValue}`;
    if (!_fallbackSeen.has(key)) {
      _fallbackSeen.add(key);
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Missing ${lang} translation, falling back to en: "${enValue}"`);
    }
  }
  return enValue;
}

export function _resetFallbackWarnings(): void {
  _fallbackSeen.clear();
}

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

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `profile_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function makeDefaultProfile(): Profile {
  return {
    id: DEFAULT_PROFILE_ID,
    target: DEFAULT_PAIR.target,
    createdAt: new Date().toISOString(),
  };
}

function validateProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || obj.id.length === 0) return null;
  if (!isTargetLang(obj.target)) return null;
  return {
    id: obj.id,
    target: obj.target,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    name: typeof obj.name === 'string' ? obj.name : undefined,
    archivedAt: (typeof obj.archivedAt === 'string' && !Number.isNaN(Date.parse(obj.archivedAt)))
      ? obj.archivedAt
      : undefined,
  };
}

function fallbackPrimary(target: TargetLang, preferred: PrimaryLang = 'en'): PrimaryLang {
  if ((preferred as string) !== (target as string)) return preferred;
  return (PRIMARY_LANGS.find(p => (p as string) !== (target as string)) ?? 'en') as PrimaryLang;
}

/**
 * Normalize a candidate knownLangs set against the current primary + target.
 * Guarantees: deduped, target excluded, primary included, non-empty.
 */
function normalizeKnown(
  candidate: readonly unknown[],
  primary: PrimaryLang,
  target: TargetLang,
): PrimaryLang[] {
  const filtered: PrimaryLang[] = [];
  const seen = new Set<string>();
  for (const v of candidate) {
    if (!isPrimaryLang(v)) continue;
    if ((v as string) === (target as string)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    filtered.push(v);
  }
  if (!filtered.includes(primary)) filtered.unshift(primary);
  if (filtered.length === 0) filtered.push(primary);
  return filtered;
}

function hydrate(): ProfilesState {
  const fromNew = pipe(
    O.fromNullable(localStorage.getItem(PROFILES_STORAGE_KEY)),
    O.flatMap(raw => {
      try { return O.some(JSON.parse(raw) as unknown); }
      catch { return O.none; }
    }),
    O.flatMap((data): O.Option<ProfilesState> => {
      if (!data || typeof data !== 'object') return O.none;
      const obj = data as Record<string, unknown>;
      if (!Array.isArray(obj.profiles)) return O.none;

      const rawProfiles = obj.profiles as unknown[];
      const validated = rawProfiles
        .map(validateProfile)
        .filter((p): p is Profile => p !== null);
      if (validated.length === 0) return O.none;

      const activeId = typeof obj.activeProfileId === 'string' ? obj.activeProfileId : '';
      const activeExists = validated.some(p => p.id === activeId && !p.archivedAt);
      const firstActive = validated.find(p => !p.archivedAt) ?? validated[0];
      const resolvedActiveId = activeExists ? activeId : firstActive.id;
      const activeProfile = validated.find(p => p.id === resolvedActiveId) ?? validated[0];

      let primaryLang: PrimaryLang;
      if (isPrimaryLang(obj.primaryLang)) {
        primaryLang = obj.primaryLang;
      } else {
        const activeRaw = rawProfiles.find(
          (r): r is Record<string, unknown> =>
            !!r && typeof r === 'object' && (r as Record<string, unknown>).id === resolvedActiveId,
        );
        const migrated = activeRaw && isPrimaryLang(activeRaw.primary) ? activeRaw.primary : null;
        primaryLang = migrated ?? 'en';
      }
      if ((primaryLang as string) === (activeProfile.target as string)) {
        primaryLang = fallbackPrimary(activeProfile.target, primaryLang);
      }

      const rawKnown = Array.isArray(obj.knownLangs) ? obj.knownLangs : [primaryLang];
      const knownLangs = normalizeKnown(rawKnown, primaryLang, activeProfile.target);

      return O.some({
        profiles: validated,
        activeProfileId: resolvedActiveId,
        primaryLang,
        knownLangs,
      });
    }),
  );
  if (O.isSome(fromNew)) return fromNew.value;

  const legacyRaw = localStorage.getItem(LEGACY_PAIR_STORAGE_KEY);
  if (legacyRaw !== null) {
    let parsed: unknown = null;
    try { parsed = JSON.parse(legacyRaw); } catch { /* fall through */ }
    const pair = validatePair(parsed);
    const profile: Profile = {
      id: DEFAULT_PROFILE_ID,
      target: pair.target,
      createdAt: new Date().toISOString(),
    };
    try { localStorage.removeItem(LEGACY_PAIR_STORAGE_KEY); } catch { /* ignore */ }
    return {
      profiles: [profile],
      activeProfileId: DEFAULT_PROFILE_ID,
      primaryLang: pair.primary,
      knownLangs: [pair.primary],
    };
  }

  return {
    profiles: [makeDefaultProfile()],
    activeProfileId: DEFAULT_PROFILE_ID,
    primaryLang: DEFAULT_PAIR.primary,
    knownLangs: [DEFAULT_PAIR.primary],
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfilesState>(hydrate);

  useEffect(() => {
    try { localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state)); }
    catch { /* quota/private mode — best effort */ }
  }, [state]);

  const activeProfile: Profile =
    state.profiles.find(p => p.id === state.activeProfileId) ?? state.profiles[0];
  const pair: LangPair = { primary: state.primaryLang, target: activeProfile.target };

  const setLangPair = (next: LangPair) => {
    if ((next.primary as string) !== (next.target as string)) {
      setState(s => {
        const known = normalizeKnown(
          s.knownLangs.includes(next.primary) ? s.knownLangs : [...s.knownLangs, next.primary],
          next.primary,
          next.target,
        );
        return {
          ...s,
          primaryLang: next.primary,
          profiles: s.profiles.map(p =>
            p.id === s.activeProfileId ? { ...p, target: next.target } : p,
          ),
          knownLangs: known,
        };
      });
      return;
    }
    // Conflict: swap-or-fallback.
    const primaryChanged = next.primary !== pair.primary;
    if (primaryChanged) {
      const oldPrimary = pair.primary;
      const swapped: TargetLang = isTargetLang(oldPrimary)
        ? oldPrimary
        : (TARGET_LANGS.find(t => (t as string) !== (next.primary as string)) as TargetLang);
      setState(s => ({
        ...s,
        primaryLang: next.primary,
        profiles: s.profiles.map(p =>
          p.id === s.activeProfileId ? { ...p, target: swapped } : p,
        ),
        knownLangs: normalizeKnown(
          s.knownLangs.includes(next.primary) ? s.knownLangs : [...s.knownLangs, next.primary],
          next.primary,
          swapped,
        ),
      }));
    } else {
      const oldTarget = pair.target;
      const swapped: PrimaryLang = isPrimaryLang(oldTarget)
        ? oldTarget
        : (PRIMARY_LANGS.find(p => (p as string) !== (next.target as string)) as PrimaryLang);
      setState(s => ({
        ...s,
        primaryLang: swapped,
        profiles: s.profiles.map(p =>
          p.id === s.activeProfileId ? { ...p, target: next.target } : p,
        ),
        knownLangs: normalizeKnown(
          s.knownLangs.includes(swapped) ? s.knownLangs : [...s.knownLangs, swapped],
          swapped,
          next.target,
        ),
      }));
    }
  };

  const toggleLanguage = () => {
    // Cycle primaryLang through knownLangs (minus the active target).
    const candidates = state.knownLangs.filter(l => (l as string) !== (activeProfile.target as string));
    if (candidates.length <= 1) return;
    const idx = candidates.indexOf(state.primaryLang);
    const next = candidates[(idx + 1) % candidates.length];
    if (next !== state.primaryLang) {
      setState(s => ({ ...s, primaryLang: next }));
    }
  };

  const setKnownLangs = (next: PrimaryLang[]) => {
    setState(s => {
      const target = (s.profiles.find(p => p.id === s.activeProfileId) ?? s.profiles[0]).target;
      const normalized = normalizeKnown(next, s.primaryLang, target);
      return { ...s, knownLangs: normalized };
    });
  };

  const toggleKnownLang = (lang: PrimaryLang) => {
    setState(s => {
      const target = (s.profiles.find(p => p.id === s.activeProfileId) ?? s.profiles[0]).target;
      if ((lang as string) === (target as string)) return s; // can't mark the target as known
      const has = s.knownLangs.includes(lang);
      let nextList: PrimaryLang[];
      if (has) {
        // Refuse to remove primary or last entry.
        if (lang === s.primaryLang) return s;
        nextList = s.knownLangs.filter(l => l !== lang);
        if (nextList.length === 0) return s;
      } else {
        nextList = [...s.knownLangs, lang];
      }
      return { ...s, knownLangs: normalizeKnown(nextList, s.primaryLang, target) };
    });
  };

  const createProfile = (input: { target: TargetLang; name?: string }): Profile => {
    if ((state.primaryLang as string) === (input.target as string)) {
      throw new Error(
        `Cannot create profile with target=${input.target} while chrome language is also ${state.primaryLang}`,
      );
    }
    const profile: Profile = {
      id: makeId(),
      target: input.target,
      createdAt: new Date().toISOString(),
      name: input.name,
    };
    setState(s => ({
      ...s,
      profiles: [...s.profiles, profile],
      activeProfileId: profile.id,
      knownLangs: normalizeKnown(s.knownLangs, s.primaryLang, profile.target),
    }));
    return profile;
  };

  const switchProfile = (id: string) => {
    setState(s => {
      const target = s.profiles.find(p => p.id === id);
      if (!target || target.archivedAt) return s;
      const primaryLang = (s.primaryLang as string) === (target.target as string)
        ? fallbackPrimary(target.target, s.primaryLang)
        : s.primaryLang;
      const knownLangs = normalizeKnown(s.knownLangs, primaryLang, target.target);
      return { ...s, activeProfileId: id, primaryLang, knownLangs };
    });
  };

  const archiveProfile = (id: string) => {
    setState(s => {
      const target = s.profiles.find(p => p.id === id);
      if (!target || target.archivedAt) return s;
      const liveAfter = s.profiles.filter(p => !p.archivedAt && p.id !== id);
      if (liveAfter.length === 0) return s;
      const stamp = new Date().toISOString();
      const profiles = s.profiles.map(p =>
        p.id === id ? { ...p, archivedAt: stamp } : p,
      );
      let activeProfileId = s.activeProfileId;
      let primaryLang = s.primaryLang;
      let knownLangs = s.knownLangs;
      if (id === s.activeProfileId) {
        const next = liveAfter[0];
        activeProfileId = next.id;
        if ((primaryLang as string) === (next.target as string)) {
          primaryLang = fallbackPrimary(next.target, primaryLang);
        }
        knownLangs = normalizeKnown(knownLangs, primaryLang, next.target);
      }
      return { profiles, activeProfileId, primaryLang, knownLangs };
    });
  };

  const renameProfile = (id: string, name: string) => {
    setState(s => ({
      ...s,
      profiles: s.profiles.map(p => p.id === id ? { ...p, name } : p),
    }));
  };

  const availablePrimaries = PRIMARY_LANGS.filter(p => (p as string) !== (activeProfile.target as string));
  const availableTargets = TARGET_LANGS.filter(t => (t as string) !== (state.primaryLang as string));

  const stringFor = (lang: Language, translations: Translations): string => {
    switch (lang) {
      case 'fr': return translations.fr;
      case 'en': return translations.en;
      case 'es': return translations.es;
      case 'zh-Hans': return translations['zh-Hans'] ?? warnFallback('zh-Hans', translations.en);
      case 'zh-Hant': return translations['zh-Hant'] ?? warnFallback('zh-Hant', translations.en);
      case 'ja': return translations.ja ?? warnFallback('ja', translations.en);
    }
  };

  const t = (translations: Translations) => ({
    primary: stringFor(activeProfile.target, translations),
    secondary: stringFor(state.primaryLang, translations),
  });

  const bilingual = (translations: Translations) => {
    const tgt = stringFor(activeProfile.target, translations);
    const prm = stringFor(state.primaryLang, translations);
    return tgt === prm ? tgt : `${tgt} / ${prm}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        pair,
        targetLang: activeProfile.target,
        primaryLang: state.primaryLang,
        setLangPair,
        toggleLanguage,
        availablePrimaries,
        availableTargets,
        t,
        bilingual,
        knownLangs: state.knownLangs,
        toggleKnownLang,
        setKnownLangs,
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        createProfile,
        switchProfile,
        archiveProfile,
        renameProfile,
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
