import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

export type TargetLang = 'fr' | 'es' | 'zh-Hans' | 'zh-Hant' | 'ja';
export type PrimaryLang = 'en' | 'fr' | 'es' | 'zh-Hans' | 'zh-Hant';
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
  /** ISO timestamp of when this profile was created. */
  createdAt: string;
  /** Optional user-set display name (e.g. "French", "Japanese basics"). */
  name?: string;
  /** ISO timestamp; presence means the profile is soft-archived. */
  archivedAt?: string;
}

const TARGET_LANGS: readonly TargetLang[] = ['fr', 'es', 'zh-Hans', 'zh-Hant', 'ja'];
const PRIMARY_LANGS: readonly PrimaryLang[] = ['en', 'fr', 'es', 'zh-Hans', 'zh-Hant'];

export const DEFAULT_PAIR: LangPair = { primary: 'en', target: 'fr' };
/** Stable id assigned to the migrated-from-legacy or initial default profile. */
export const DEFAULT_PROFILE_ID = 'default';

/** Canonical storage key — full profiles list + active id + global primary. */
const PROFILES_STORAGE_KEY = 'outputfirst_profiles';
/** Legacy single-pair key. Migrated on first hydrate then deleted. */
const LEGACY_PAIR_STORAGE_KEY = 'outputfirst_lang_pair';

/**
 * Translations keyed by language code. `zh-Hans` / `zh-Hant` / `ja` are
 * optional; when omitted, the lookup falls back to English.
 */
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
}

interface LanguageContextType {
  // ---- pair-shaped reads (preserved for back-compat) ----
  pair: LangPair;
  targetLang: TargetLang;
  primaryLang: PrimaryLang;
  /** Updates the global primary AND the active profile's target in one call. Enforces primary !== target. */
  setLangPair: (next: LangPair) => void;
  /** Cheap one-tap flip: cycles global primaryLang through valid options (skips active target). */
  toggleLanguage: () => void;
  /** Available primary options that don't conflict with the active profile's target. */
  availablePrimaries: readonly PrimaryLang[];
  /** Available target options that don't conflict with the global primary. */
  availableTargets: readonly TargetLang[];
  /** Returns { primary: target-language string, secondary: primary-language string }. */
  t: (translations: Translations) => { primary: string; secondary: string };
  /** Returns "{target-string} / {primary-string}". */
  bilingual: (translations: Translations) => string;

  // ---- profile-management API ----
  /** All profiles, including archived ones. Sort by createdAt for display. */
  profiles: readonly Profile[];
  activeProfileId: string;
  /** Create a new profile (target only — primary is global) and switch to it. */
  createProfile: (input: { target: TargetLang; name?: string }) => Profile;
  /** Switch to a different non-archived profile. Auto-adjusts global primary if it would conflict with the new target. */
  switchProfile: (id: string) => void;
  /** Soft-archive a profile. Refuses to archive the last live profile. */
  archiveProfile: (id: string) => void;
  /** Set the user-facing display name on a profile. */
  renameProfile: (id: string, name: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Dev-mode warning when a translation key is missing and stringFor() falls
 * back to English. Memoized per (lang, en-value) pair so the console isn't
 * flooded by re-renders of the same call site.
 */
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

/** Test-only: clears the dedupe set so each test sees a clean console. */
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

/**
 * Validate a stored profile object. Accepts both:
 *  - new shape: { id, target, createdAt, name?, archivedAt? }
 *  - legacy Phase 0 shape: { id, primary, target, ... } — `primary` is read by
 *    the caller and lifted to global state, then ignored here.
 */
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

/**
 * Pick a fallback primary that doesn't equal the given target. Used when the
 * stored or requested primary conflicts with the active target.
 */
function fallbackPrimary(target: TargetLang, preferred: PrimaryLang = 'en'): PrimaryLang {
  if ((preferred as string) !== (target as string)) return preferred;
  return (PRIMARY_LANGS.find(p => (p as string) !== (target as string)) ?? 'en') as PrimaryLang;
}

function hydrate(): ProfilesState {
  // 1. Try the canonical profiles storage first.
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

      // Lift `primary` from each raw profile so we can recover the global
      // primary in the Phase 0 → Path A migration case.
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

      // Resolve global primary:
      //   a) explicit top-level field (new shape)
      //   b) Phase 0 migration: pull primary off the active raw profile
      //   c) fallback: 'en' if non-conflicting, else first non-target primary
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
      // Invariant: primary !== active target. If violated, fall back.
      if ((primaryLang as string) === (activeProfile.target as string)) {
        primaryLang = fallbackPrimary(activeProfile.target, primaryLang);
      }

      return O.some({
        profiles: validated,
        activeProfileId: resolvedActiveId,
        primaryLang,
      });
    }),
  );
  if (O.isSome(fromNew)) return fromNew.value;

  // 2. Fall back to the legacy single-pair key (one-shot migration).
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
    };
  }

  // 3. First-ever run: default profile.
  return {
    profiles: [makeDefaultProfile()],
    activeProfileId: DEFAULT_PROFILE_ID,
    primaryLang: DEFAULT_PAIR.primary,
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfilesState>(hydrate);

  useEffect(() => {
    try { localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state)); }
    catch { /* quota/private mode — best effort */ }
  }, [state]);

  // Derive the active profile. Fallback to first if somehow missing.
  const activeProfile: Profile =
    state.profiles.find(p => p.id === state.activeProfileId) ?? state.profiles[0];
  const pair: LangPair = { primary: state.primaryLang, target: activeProfile.target };

  const patchActiveTarget = (target: TargetLang) => {
    setState(s => ({
      ...s,
      profiles: s.profiles.map(p =>
        p.id === s.activeProfileId ? { ...p, target } : p,
      ),
    }));
  };

  const setLangPair = (next: LangPair) => {
    if ((next.primary as string) !== (next.target as string)) {
      setState(s => ({
        ...s,
        primaryLang: next.primary,
        profiles: s.profiles.map(p =>
          p.id === s.activeProfileId ? { ...p, target: next.target } : p,
        ),
      }));
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
      }));
    }
  };

  const toggleLanguage = () => {
    const idx = PRIMARY_LANGS.indexOf(state.primaryLang);
    for (let i = 1; i <= PRIMARY_LANGS.length; i++) {
      const candidate = PRIMARY_LANGS[(idx + i) % PRIMARY_LANGS.length];
      if ((candidate as string) !== (activeProfile.target as string)) {
        setState(s => ({ ...s, primaryLang: candidate }));
        return;
      }
    }
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
    }));
    return profile;
  };

  const switchProfile = (id: string) => {
    setState(s => {
      const target = s.profiles.find(p => p.id === id);
      if (!target || target.archivedAt) return s;
      // Auto-adjust primary if it would equal the new target.
      const primaryLang = (s.primaryLang as string) === (target.target as string)
        ? fallbackPrimary(target.target, s.primaryLang)
        : s.primaryLang;
      return { ...s, activeProfileId: id, primaryLang };
    });
  };

  const archiveProfile = (id: string) => {
    setState(s => {
      const target = s.profiles.find(p => p.id === id);
      if (!target || target.archivedAt) return s;
      // Refuse to archive the last live profile — would strand the user on an
      // archived pair with no way to recover via switchProfile (it ignores archived).
      const liveAfter = s.profiles.filter(p => !p.archivedAt && p.id !== id);
      if (liveAfter.length === 0) return s;
      const stamp = new Date().toISOString();
      const profiles = s.profiles.map(p =>
        p.id === id ? { ...p, archivedAt: stamp } : p,
      );
      let activeProfileId = s.activeProfileId;
      let primaryLang = s.primaryLang;
      if (id === s.activeProfileId) {
        const next = liveAfter[0];
        activeProfileId = next.id;
        // Same primary-vs-target guard as switchProfile.
        if ((primaryLang as string) === (next.target as string)) {
          primaryLang = fallbackPrimary(next.target, primaryLang);
        }
      }
      return { profiles, activeProfileId, primaryLang };
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
