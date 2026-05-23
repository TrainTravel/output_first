import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FontProvider, useFont, FONT_OPTIONS } from './FontContext';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'outputfirst_font_pref';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.removeProperty('--font-body');
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <FontProvider>{children}</FontProvider>
);

describe('FontContext — hydration', () => {
  it('defaults to "default" when nothing stored', () => {
    const { result } = renderHook(() => useFont(), { wrapper });
    expect(result.current.font).toBe('default');
  });

  it('hydrates a valid stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'lexend');
    const { result } = renderHook(() => useFont(), { wrapper });
    expect(result.current.font).toBe('lexend');
  });

  it('falls back to "default" when stored value is not a known FontKey', () => {
    localStorage.setItem(STORAGE_KEY, 'comic-sans');
    const { result } = renderHook(() => useFont(), { wrapper });
    expect(result.current.font).toBe('default');
  });

  it('falls back to "default" when localStorage throws', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    try {
      const { result } = renderHook(() => useFont(), { wrapper });
      expect(result.current.font).toBe('default');
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});

describe('FontContext — setFont', () => {
  it('updates state on a valid key', () => {
    const { result } = renderHook(() => useFont(), { wrapper });
    act(() => result.current.setFont('atkinson'));
    expect(result.current.font).toBe('atkinson');
  });

  it('rejects an invalid key by falling back to "default"', () => {
    const { result } = renderHook(() => useFont(), { wrapper });
    act(() => result.current.setFont('lexend'));
    expect(result.current.font).toBe('lexend');
    // @ts-expect-error — deliberately passing an invalid key
    act(() => result.current.setFont('papyrus'));
    expect(result.current.font).toBe('default');
  });

  it('persists the chosen font to localStorage', () => {
    const { result } = renderHook(() => useFont(), { wrapper });
    act(() => result.current.setFont('mono'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('mono');
  });

  it('updates the --font-body CSS variable on the document root', () => {
    const { result } = renderHook(() => useFont(), { wrapper });
    act(() => result.current.setFont('opendyslexic'));
    const cssVar = document.documentElement.style.getPropertyValue('--font-body');
    const opt = FONT_OPTIONS.find(o => o.id === 'opendyslexic');
    expect(cssVar).toBe(opt?.cssFamily ?? '');
  });

  it('writes a known cssFamily on every setFont call (all 5 options round-trip)', () => {
    const { result } = renderHook(() => useFont(), { wrapper });
    for (const opt of FONT_OPTIONS) {
      act(() => result.current.setFont(opt.id));
      expect(result.current.font).toBe(opt.id);
      expect(document.documentElement.style.getPropertyValue('--font-body')).toBe(opt.cssFamily);
    }
  });
});

describe('FontContext — surface', () => {
  it('exposes the full FONT_OPTIONS list via options', () => {
    const { result } = renderHook(() => useFont(), { wrapper });
    expect(result.current.options).toEqual(FONT_OPTIONS);
  });

  it('useFont throws when used outside the provider', () => {
    expect(() => renderHook(() => useFont())).toThrow(/within FontProvider/);
  });
});
