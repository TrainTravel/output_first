import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage, DEFAULT_PAIR, _resetFallbackWarnings } from './LanguageContext';
import type { PrimaryLang } from './LanguageContext';
import type { ReactNode } from 'react';

/** Legacy key — still readable for one-shot migration. */
const STORAGE_KEY = 'outputfirst_lang_pair';
/** New canonical key — where profile state actually lives now. */
const PROFILES_STORAGE_KEY = 'outputfirst_profiles';

beforeEach(() => {
  localStorage.clear();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('hydration', () => {
  it('returns DEFAULT_PAIR when nothing stored', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
    expect(result.current.targetLang).toBe('fr');
    expect(result.current.primaryLang).toBe('en');
  });

  it('falls back to DEFAULT_PAIR on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
  });

  it('falls back to DEFAULT_PAIR when primary equals target (invariant violation)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'fr' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
  });

  it('falls back to DEFAULT_PAIR when target is an unknown code', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'xx' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
  });

  it('falls back to DEFAULT_PAIR when primary is an unknown code', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zz', target: 'fr' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
  });

  it('accepts a valid stored pair', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'zh-Hans' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual({ primary: 'fr', target: 'zh-Hans' });
  });

  it('accepts primary=zh-Hans paired with a non-Chinese target', () => {
    // target='en' is rejected (en cannot be a learning language) — use fr instead.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hans', target: 'fr' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual({ primary: 'zh-Hans', target: 'fr' });
  });

  it('accepts primary=zh-Hant paired with a non-Chinese target', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hant', target: 'es' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual({ primary: 'zh-Hant', target: 'es' });
  });

  it('falls back to DEFAULT_PAIR when primary=zh-Hans equals target=zh-Hans (invariant violation)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hans', target: 'zh-Hans' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
  });

  it('rejects target=en (en cannot be a learning language in this model)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'en' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
  });

  it('accepts target=ja paired with primary=en (Japanese is target-only)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual({ primary: 'en', target: 'ja' });
  });

  it('rejects primary=ja (Japanese is not a valid primary)', () => {
    // 'ja' is intentionally absent from PRIMARY_LANGS — a stored pair with
    // primary=ja must hydrate back to DEFAULT_PAIR.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'ja', target: 'fr' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
  });

  it('rejects pair with both primary=ja and target=ja (invariant + ja-as-primary violation)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'ja', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual(DEFAULT_PAIR);
  });
});

describe('setLangPair — invariant enforcement', () => {
  it('accepts a non-conflicting pair as-is', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLangPair({ primary: 'fr', target: 'es' }));
    expect(result.current.pair).toEqual({ primary: 'fr', target: 'es' });
  });

  it('swaps when user changes primary to equal current target (both swappable)', () => {
    // Start: primary=fr, target=es. User picks primary=es → swap to primary=es, target=fr.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'es' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLangPair({ primary: 'es', target: 'es' }));
    expect(result.current.pair).toEqual({ primary: 'es', target: 'fr' });
  });

  it('swaps when user changes target to equal current primary (both swappable)', () => {
    // Start: primary=fr, target=es. User picks target=fr → swap to primary=es, target=fr.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'es' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLangPair({ primary: 'fr', target: 'fr' }));
    expect(result.current.pair).toEqual({ primary: 'es', target: 'fr' });
  });

  it('falls back when user changes primary to equal target and old primary was en (not a valid target)', () => {
    // Start: primary=en, target=fr. User picks primary=fr → can't swap to target=en (invalid).
    // Must pick some target != 'fr'. Implementation picks the first TARGET_LANG that isn't 'fr'.
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLangPair({ primary: 'fr', target: 'fr' }));
    expect(result.current.pair.primary).toBe('fr');
    expect(result.current.pair.target).not.toBe('fr');
  });

  it('falls back when user changes target to equal primary and old target was zh-* (not a valid primary)', () => {
    // Start: primary=en, target=zh-Hans. User picks target=en → can't swap to primary=zh-Hans (invalid).
    // Must pick some primary != 'en'.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'zh-Hans' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // 'en' isn't a valid TargetLang, but the setter rejects equal pairs regardless;
    // we exercise the conflict path by sending target equal to the current primary.
    act(() => result.current.setLangPair({ primary: 'en', target: 'en' as never }));
    // Either the conflict logic kicked in (target stays a valid TargetLang) or the equal-check
    // fired. The important invariant is: primary !== target after the call.
    expect(result.current.pair.primary).not.toBe(result.current.pair.target);
  });
});

describe('setLangPair — persistence', () => {
  it('writes the new pair to localStorage (via the active profile)', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLangPair({ primary: 'es', target: 'zh-Hant' }));
    const stored = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) ?? 'null');
    expect(stored).not.toBeNull();
    const active = stored.profiles.find((p: { id: string }) => p.id === stored.activeProfileId);
    expect(active.primary).toBe('es');
    expect(active.target).toBe('zh-Hant');
  });
});

describe('toggleLanguage — cheap one-tap flip of primary', () => {
  it('cycles primary through en → fr → es → zh-Hans → zh-Hant, skipping the current target', () => {
    // pair starts as { primary: 'en', target: 'fr' }. Cycle is [en, fr, es, zh-Hans, zh-Hant].
    // From en, next non-target is 'es' (skip 'fr' which equals target).
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual({ primary: 'en', target: 'fr' });

    act(() => result.current.toggleLanguage());
    expect(result.current.pair.primary).toBe('es');
    expect(result.current.pair.target).toBe('fr');
  });

  it('cycles through all 5 primaries when target does not conflict', () => {
    // Start: primary=en, target=fr. From this state, cycling should visit: es, zh-Hans, zh-Hant, en, es...
    // (Each step skips the current target 'fr'.)
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const visited: string[] = [];
    for (let i = 0; i < 5; i++) {
      act(() => result.current.toggleLanguage());
      visited.push(result.current.pair.primary);
    }
    // The four non-'fr' primaries appear, none of them equal target='fr'.
    expect(visited).toEqual(['es', 'zh-Hans', 'zh-Hant', 'en', 'es']);
    expect(visited.every(p => p !== 'fr')).toBe(true);
  });

  it('preserves the invariant after every toggle', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    for (let i = 0; i < 10; i++) {
      act(() => result.current.toggleLanguage());
      expect(result.current.pair.primary).not.toBe(result.current.pair.target);
    }
  });
});

describe('availablePrimaries / availableTargets — UI-layer filters', () => {
  it('availablePrimaries excludes the current target', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'fr' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.availablePrimaries).not.toContain('fr');
    expect(result.current.availablePrimaries).toContain('en');
    expect(result.current.availablePrimaries).toContain('es');
    expect(result.current.availablePrimaries).toContain('zh-Hans');
    expect(result.current.availablePrimaries).toContain('zh-Hant');
  });

  it('availablePrimaries excludes the current target when primary is Chinese', () => {
    // primary=zh-Hans, target=zh-Hant — zh-Hant must be excluded from primary options.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hans', target: 'zh-Hant' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.availablePrimaries).not.toContain('zh-Hant');
    expect(result.current.availablePrimaries).toContain('zh-Hans');
    expect(result.current.availablePrimaries).toContain('en');
    expect(result.current.availablePrimaries).toContain('fr');
    expect(result.current.availablePrimaries).toContain('es');
  });

  it('availableTargets excludes the current primary', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'es' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.availableTargets).not.toContain('fr');
    expect(result.current.availableTargets).toContain('es');
    expect(result.current.availableTargets).toContain('zh-Hans');
  });

  it('availableTargets includes ja regardless of primary', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'fr' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.availableTargets).toContain('ja');
  });
});

describe('t() — string lookup', () => {
  it('primary = target-language string, secondary = primary-language string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t({ fr: 'Continuer', en: 'Continue', es: 'Continuar' });
    expect(out.primary).toBe('Continuer');   // target = fr
    expect(out.secondary).toBe('Continue');  // primary = en
  });

  it('falls back to English for zh-* when zhHans/zhHant arg is omitted', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'zh-Hans' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola' });
    expect(out.primary).toBe('Hello'); // fallback
    expect(out.secondary).toBe('Hello');
  });

  it('falls back to English for ja when the ja key is omitted (graceful chrome fallback)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola' });
    expect(out.primary).toBe('Hello'); // graceful fallback, chrome stays English
    expect(out.secondary).toBe('Hello');
  });

  it('uses the ja string when provided', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola', ja: 'こんにちは' });
    expect(out.primary).toBe('こんにちは');
    expect(out.secondary).toBe('Hello');
  });
});

describe('bilingual() — formatted pair', () => {
  it('returns "{target} / {primary}"', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.bilingual({ fr: 'Vide-tête', en: 'Brain Dump', es: 'Volcado mental' }))
      .toBe('Vide-tête / Brain Dump');
  });

  it('dedupes when target and primary resolve to the same string', () => {
    // target=ja primary=zh-Hant; neither key present → both fall back to en.
    // bilingual() should render once, not "Write today / Write today".
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hant', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.bilingual({ fr: "Écrire aujourd'hui", en: 'Write today', es: 'Escribir hoy' }))
      .toBe('Write today');
  });

  it('does not dedupe when target and primary differ', () => {
    // target=fr primary=en — both resolve and differ → keep the pair.
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.bilingual({ fr: "Écrire aujourd'hui", en: 'Write today', es: 'Escribir hoy' }))
      .toBe("Écrire aujourd'hui / Write today");
  });

  it('renders both when ja and zh-Hant keys are provided', () => {
    // Same pair as the dedupe case, but now both keys are present → no fallback,
    // no dedupe, both strings render.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hant', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.bilingual({
      fr: "Écrire aujourd'hui",
      en: 'Write today',
      es: 'Escribir hoy',
      ja: '今日書きましょう',
      'zh-Hans': '今天写日记',
      'zh-Hant': '今天寫日記',
    })).toBe('今日書きましょう / 今天寫日記');
  });
});

describe('stringFor() — dev-mode fallback warning', () => {
  beforeEach(() => {
    _resetFallbackWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns when ja key is missing and falls back to en', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola' });
    expect(out.primary).toBe('Hello'); // falls back to en
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Missing ja translation'),
    );
  });

  it('warns when zh-Hant key is missing and falls back to en', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hant', target: 'fr' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola' });
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Missing zh-Hant translation'),
    );
  });

  it('does not warn when the requested key is present', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola', ja: 'こんにちは' });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does not warn for fr / en / es lookups (no fallback possible)', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola' });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('dedupes repeat warnings for the same (lang, en) pair', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'ja' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // Fire 3 times — should only warn once because the (ja, 'Hello') key is memoized.
    result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola' });
    result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola' });
    result.current.t({ fr: 'Bonjour', en: 'Hello', es: 'Hola' });
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Phase 0: profile lifecycle + legacy migration tests
// ─────────────────────────────────────────────────────────────

describe('profiles — legacy migration from outputfirst_lang_pair', () => {
  it('on first hydrate, migrates a valid legacy pair into one profile and deletes the old key', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'es' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].primary).toBe('en');
    expect(result.current.profiles[0].target).toBe('es');
    expect(result.current.activeProfileId).toBe(result.current.profiles[0].id);
    // Legacy key cleaned up.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    // New key populated.
    expect(localStorage.getItem('outputfirst_profiles')).not.toBeNull();
  });

  it('on first hydrate with no storage, creates a default profile', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].primary).toBe(DEFAULT_PAIR.primary);
    expect(result.current.profiles[0].target).toBe(DEFAULT_PAIR.target);
  });

  it('prefers new storage when both old + new exist (no double-migration)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'es' }));
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify({
      profiles: [{ id: 'p-existing', primary: 'fr', target: 'ja', createdAt: '2026-01-01T00:00:00Z' }],
      activeProfileId: 'p-existing',
    }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].id).toBe('p-existing');
    expect(result.current.pair).toEqual({ primary: 'fr', target: 'ja' });
    // Legacy key is NOT touched when new storage was the source.
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });
});

describe('profiles — lifecycle (create / switch / archive / rename)', () => {
  it('createProfile adds a new profile and switches to it', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const before = result.current.activeProfileId;
    let createdId = '';
    act(() => {
      const p = result.current.createProfile({ primary: 'en', target: 'ja', name: 'Japanese' });
      createdId = p.id;
    });
    expect(result.current.profiles).toHaveLength(2);
    expect(result.current.activeProfileId).toBe(createdId);
    expect(result.current.activeProfileId).not.toBe(before);
    expect(result.current.pair).toEqual({ primary: 'en', target: 'ja' });
  });

  it('createProfile throws when primary === target', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      act(() => { result.current.createProfile({ primary: 'fr' as PrimaryLang, target: 'fr' as any }); });
    }).toThrow(/must differ/);
  });

  it('switchProfile changes activeProfileId to an existing non-archived profile', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    let secondId = '';
    act(() => { secondId = result.current.createProfile({ primary: 'en', target: 'ja' }).id; });
    const firstId = result.current.profiles.find(p => p.id !== secondId)?.id ?? '';
    act(() => { result.current.switchProfile(firstId); });
    expect(result.current.activeProfileId).toBe(firstId);
  });

  it('switchProfile is a no-op for an unknown id', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const before = result.current.activeProfileId;
    act(() => { result.current.switchProfile('does-not-exist'); });
    expect(result.current.activeProfileId).toBe(before);
  });

  it('archiveProfile marks archivedAt and jumps active to the next non-archived', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    let secondId = '';
    act(() => { secondId = result.current.createProfile({ primary: 'en', target: 'ja' }).id; });
    // Active is the newly-created Japanese profile. Archive it.
    act(() => { result.current.archiveProfile(secondId); });
    const archived = result.current.profiles.find(p => p.id === secondId);
    expect(archived?.archivedAt).toBeDefined();
    // Active jumped to the original (non-archived) profile.
    expect(result.current.activeProfileId).not.toBe(secondId);
    expect(result.current.profiles.find(p => p.id === result.current.activeProfileId)?.archivedAt).toBeUndefined();
  });

  it('renameProfile updates only the name field on the target profile', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const id = result.current.activeProfileId;
    act(() => { result.current.renameProfile(id, 'My French'); });
    const renamed = result.current.profiles.find(p => p.id === id);
    expect(renamed?.name).toBe('My French');
  });

  it('persisting + reloading round-trips the full profile list and active id', () => {
    // Round 1: create a second profile and rename the first.
    const { result, unmount } = renderHook(() => useLanguage(), { wrapper });
    const firstId = result.current.activeProfileId;
    act(() => { result.current.renameProfile(firstId, 'French'); });
    let secondId = '';
    act(() => { secondId = result.current.createProfile({ primary: 'en', target: 'ja', name: 'Japanese' }).id; });
    // Switch back to first.
    act(() => { result.current.switchProfile(firstId); });
    unmount();

    // Round 2: fresh provider re-hydrates from localStorage.
    const { result: result2 } = renderHook(() => useLanguage(), { wrapper });
    expect(result2.current.profiles).toHaveLength(2);
    expect(result2.current.activeProfileId).toBe(firstId);
    expect(result2.current.profiles.find(p => p.id === firstId)?.name).toBe('French');
    expect(result2.current.profiles.find(p => p.id === secondId)?.name).toBe('Japanese');
  });
});
