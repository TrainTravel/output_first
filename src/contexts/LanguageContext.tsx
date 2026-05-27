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
 * A learning profile = one language pair plus identity. Per-profile data
 * (journal entries, vocab progress, etc.) is keyed off the profile's `id`
 * via `useProfileStorage()` in Phase 1.
 */
export interface Profile {
  id: string;
  primary: PrimaryLang;
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

/** New storage key — the full profiles list + active id. */
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
}

interface LanguageContextType {
  // ---- existing API (preserved verbatim — all reads from the active profile) ----
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
  t: (translations: Translations) => { primary: string; secondary: string };
  /** Returns "{target-string} / {primary-string}". */
  bilingual: (translations: Translations) => string;

  // ---- new profile-management API ----
  /** All profiles, including archived ones. Sort by createdAt for display. */
  profiles: readonly Profile[];
  activeProfileId: string;
  /** Create a new profile and switch to it. Returns the created profile. */
  createProfile: (input: { primary: PrimaryLang; target: TargetLang; name?: string }) => Profile;
  /** Switch to a different non-archived profile. No-op if id is unknown or archived. */
  switchProfile: (id: string) => void;
  /** Soft-archive a profile. If it was active, falls back to the first non-archived one. */
  archiveProfile: (id: string) => void;
  /** Set the user-facing display name on a profile. */
  renameProfile: (id: string, name: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Dev-mode warning when a translation key is missing and stringFor() falls
 * back to English. Memoized per (lang, en-value) pair so the console isn't
 * flooded by re-renders of the same call site.
 *
 * In prod (import.meta.env.DEV === false) this is a no-op pass-through —
 * the en value is still returned, no logging cost. Exported for tests.
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
    primary: DEFAULT_PAIR.primary,
    target: DEFAULT_PAIR.target,
    createdAt: new Date().toISOString(),
  };
}

function validateProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || obj.id.length === 0) return null;
  if (!isPrimaryLang(obj.primary)) return null;
  if (!isTargetLang(obj.target)) return null;
  if ((obj.primary as string) === (obj.target as string)) return null;
  return {
    id: obj.id,
    primary: obj.primary,
    target: obj.target,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    name: typeof obj.name === 'string' ? obj.name : undefined,
    archivedAt: typeof obj.archivedAt === 'string' ? obj.archivedAt : undefined,
  };
}

function hydrate(): ProfilesState {
  // 1. Try the new profiles storage first.
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
      const validated = (obj.profiles as unknown[])
        .map(validateProfile)
        .filter((p): p is Profile => p !== null);
      if (validated.length === 0) return O.none;
      const activeId = typeof obj.activeProfileId === 'string' ? obj.activeProfileId : '';
      const activeExists = validated.some(p => p.id === activeId && !p.archivedAt);
      const firstActive = validated.find(p => !p.archivedAt) ?? validated[0];
      return O.some({
        profiles: validated,
        activeProfileId: activeExists ? activeId : firstActive.id,
      });
    }),
  );
  if (O.isSome(fromNew)) return fromNew.value;

  // 2. Fall back to the legacy single-pair key (one-shot migration).
  const legacyRaw = localStorage.getItem(LEGACY_PAIR_STORAGE_KEY);
  if (legacyRaw !== null) {
    // Migrate whatever's in the legacy key (validatePair handles invalid input).
    let parsed: unknown = null;
    try { parsed = JSON.parse(legacyRaw); } catch { /* fall through */ }
    const pair = validatePair(parsed);
    const profile: Profile = {
      id: DEFAULT_PROFILE_ID,
      primary: pair.primary,
      target: pair.target,
      createdAt: new Date().toISOString(),
    };
    try { localStorage.removeItem(LEGACY_PAIR_STORAGE_KEY); } catch { /* ignore */ }
    return { profiles: [profile], activeProfileId: DEFAULT_PROFILE_ID };
  }

  // 3. First-ever run: default profile.
  return { profiles: [makeDefaultProfile()], activeProfileId: DEFAULT_PROFILE_ID };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfilesState>(hydrate);

  useEffect(() => {
    try { localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state)); }
    catch { /* quota/private mode — best effort */ }
  }, [state]);

  // Derive the active profile. If somehow not found (shouldn't happen with the
  // hydration guard), fall back to the first profile in the list.
  const activeProfile: Profile =
    state.profiles.find(p => p.id === state.activeProfileId) ?? state.profiles[0];
  const pair: LangPair = { primary: activeProfile.primary, target: activeProfile.target };

  // Update only the active profile in-place.
  const patchActive = (patch: Partial<Profile>) => {
    setState(s => ({
      ...s,
      profiles: s.profiles.map(p =>
        p.id === s.activeProfileId ? { ...p, ...patch } : p,
      ),
    }));
  };

  const setLangPair = (next: LangPair) => {
    if ((next.primary as string) !== (next.target as string)) {
      patchActive({ primary: next.primary, target: next.target });
      return;
    }
    // Conflict: swap-or-fallback to keep the invariant.
    const primaryChanged = next.primary !== pair.primary;
    if (primaryChanged) {
      const oldPrimary = pair.primary;
      const swapped: TargetLang = isTargetLang(oldPrimary)
        ? oldPrimary
        : (TARGET_LANGS.find(t => (t as string) !== (next.primary as string)) as TargetLang);
      patchActive({ primary: next.primary, target: swapped });
    } else {
      const oldTarget = pair.target;
      const swapped: PrimaryLang = isPrimaryLang(oldTarget)
        ? oldTarget
        : (PRIMARY_LANGS.find(p => (p as string) !== (next.target as string)) as PrimaryLang);
      patchActive({ primary: swapped, target: next.target });
    }
  };

  const toggleLanguage = () => {
    const idx = PRIMARY_LANGS.indexOf(pair.primary);
    for (let i = 1; i <= PRIMARY_LANGS.length; i++) {
      const candidate = PRIMARY_LANGS[(idx + i) % PRIMARY_LANGS.length];
      if ((candidate as string) !== (pair.target as string)) {
        patchActive({ primary: candidate });
        return;
      }
    }
  };

  const createProfile = (input: { primary: PrimaryLang; target: TargetLang; name?: string }): Profile => {
    if ((input.primary as string) === (input.target as string)) {
      throw new Error('Profile primary and target must differ');
    }
    const profile: Profile = {
      id: makeId(),
      primary: input.primary,
      target: input.target,
      createdAt: new Date().toISOString(),
      name: input.name,
    };
    setState(s => ({
      profiles: [...s.profiles, profile],
      activeProfileId: profile.id, // switch immediately so per-profile data writes go to it
    }));
    return profile;
  };

  const switchProfile = (id: string) => {
    setState(s => {
      const target = s.profiles.find(p => p.id === id);
      if (!target || target.archivedAt) return s;
      return { ...s, activeProfileId: id };
    });
  };

  const archiveProfile = (id: string) => {
    setState(s => {
      const stamp = new Date().toISOString();
      const profiles = s.profiles.map(p =>
        p.id === id ? { ...p, archivedAt: stamp } : p,
      );
      // If archiving the active one, jump to first non-archived (or stay if none).
      let activeProfileId = s.activeProfileId;
      if (id === s.activeProfileId) {
        const nextActive = profiles.find(p => !p.archivedAt);
        if (nextActive) activeProfileId = nextActive.id;
      }
      return { profiles, activeProfileId };
    });
  };

  const renameProfile = (id: string, name: string) => {
    setState(s => ({
      ...s,
      profiles: s.profiles.map(p => p.id === id ? { ...p, name } : p),
    }));
  };

  const availablePrimaries = PRIMARY_LANGS.filter(p => (p as string) !== (pair.target as string));
  const availableTargets = TARGET_LANGS.filter(t => (t as string) !== (pair.primary as string));

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
    primary: stringFor(pair.target, translations),
    secondary: stringFor(pair.primary, translations),
  });

  const bilingual = (translations: Translations) => {
    const tgt = stringFor(pair.target, translations);
    const prm = stringFor(pair.primary, translations);
    // Dedupe: when target and primary resolve to the same string (typically
    // because both fell back to en), render once instead of "X / X".
    return tgt === prm ? tgt : `${tgt} / ${prm}`;
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
