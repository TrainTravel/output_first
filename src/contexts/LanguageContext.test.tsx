import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage, DEFAULT_PAIR } from './LanguageContext';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'outputfirst_lang_pair';

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

  it('rejects target=en (en cannot be a learning language in this model)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'en' }));
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
  it('writes the new pair to localStorage', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLangPair({ primary: 'es', target: 'zh-Hant' }));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    expect(stored).toEqual({ primary: 'es', target: 'zh-Hant' });
  });
});

describe('toggleLanguage — cheap one-tap flip of primary', () => {
  it('cycles primary through en → fr → es, skipping the current target', () => {
    // pair starts as { primary: 'en', target: 'fr' }. Cycle is [en, fr, es].
    // From en, next non-target is 'es' (skip 'fr' which equals target).
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.pair).toEqual({ primary: 'en', target: 'fr' });

    act(() => result.current.toggleLanguage());
    expect(result.current.pair.primary).toBe('es');
    expect(result.current.pair.target).toBe('fr');
  });

  it('preserves the invariant after every toggle', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    for (let i = 0; i < 6; i++) {
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
  });

  it('availableTargets excludes the current primary', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'es' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.availableTargets).not.toContain('fr');
    expect(result.current.availableTargets).toContain('es');
    expect(result.current.availableTargets).toContain('zh-Hans');
  });
});

describe('t() — string lookup', () => {
  it('primary = target-language string, secondary = primary-language string', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t('Continuer', 'Continue', 'Continuar');
    expect(out.primary).toBe('Continuer');   // target = fr
    expect(out.secondary).toBe('Continue');  // primary = en
  });

  it('falls back to English for zh-* when zhHans/zhHant arg is omitted', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'en', target: 'zh-Hans' }));
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const out = result.current.t('Bonjour', 'Hello', 'Hola');
    expect(out.primary).toBe('Hello'); // fallback
    expect(out.secondary).toBe('Hello');
  });
});

describe('bilingual() — formatted pair', () => {
  it('returns "{target} / {primary}"', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.bilingual('Vide-tête', 'Brain Dump', 'Volcado mental'))
      .toBe('Vide-tête / Brain Dump');
  });
});
