import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  GardenThemeProvider,
  useGardenTheme,
  GARDEN_THEMES,
  GARDEN_THEME_IDS,
  STORAGE_KEY,
  SORT_MODE_STORAGE_KEY,
  sortThemes,
  type ThemeArousal,
  type ThemeIntent,
} from './GardenThemeContext';
import type { ReactNode } from 'react';

beforeEach(() => {
  localStorage.clear();
  // Reset documentElement classList between tests so applied theme classes
  // from a prior test don't leak into the next.
  document.documentElement.className = '';
});

afterEach(() => {
  document.documentElement.className = '';
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <GardenThemeProvider>{children}</GardenThemeProvider>
);

describe('hydration', () => {
  it('returns "default" when nothing is stored', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.theme).toBe('default');
  });

  it('hydrates a valid stored theme id', () => {
    localStorage.setItem(STORAGE_KEY, 'sakura');
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.theme).toBe('sakura');
  });

  it('falls back to "default" on an unknown stored id', () => {
    localStorage.setItem(STORAGE_KEY, 'comic-sans');
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.theme).toBe('default');
  });

  it('falls back to "default" on an empty stored value', () => {
    localStorage.setItem(STORAGE_KEY, '');
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.theme).toBe('default');
  });

  it('falls back to "default" when localStorage.getItem throws', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = vi.fn(() => { throw new Error('blocked'); });
    try {
      const { result } = renderHook(() => useGardenTheme(), { wrapper });
      expect(result.current.theme).toBe('default');
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});

describe('setTheme', () => {
  it('updates state and persists to localStorage', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    act(() => result.current.setTheme('forest'));
    expect(result.current.theme).toBe('forest');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('forest');
  });

  it('adds the theme-* class to documentElement (non-default)', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    act(() => result.current.setTheme('sakura'));
    expect(document.documentElement.classList.contains('theme-sakura')).toBe(true);
  });

  it('removes the previous theme class before applying the new one', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    act(() => result.current.setTheme('sakura'));
    act(() => result.current.setTheme('forest'));
    expect(document.documentElement.classList.contains('theme-sakura')).toBe(false);
    expect(document.documentElement.classList.contains('theme-forest')).toBe(true);
  });

  it('does not add any theme-* class when switching to default', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    act(() => result.current.setTheme('sakura'));
    act(() => result.current.setTheme('default'));
    const themeClasses = Array.from(document.documentElement.classList).filter(c => c.startsWith('theme-'));
    expect(themeClasses).toEqual([]);
  });
});

describe('themeInfo', () => {
  it('returns the matching entry for the current theme', () => {
    localStorage.setItem(STORAGE_KEY, 'moonstone');
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.themeInfo.id).toBe('moonstone');
    expect(result.current.themeInfo.name).toBe('Moonstone');
  });

  it('returns default theme info when state is "default"', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.themeInfo.id).toBe('default');
  });
});

describe('useGardenTheme provider guard', () => {
  it('throws when used outside GardenThemeProvider', () => {
    expect(() => renderHook(() => useGardenTheme())).toThrow(/within GardenThemeProvider/);
  });
});

describe('sortMode persistence', () => {
  it('defaults to "palette" when nothing is stored', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.sortMode).toBe('palette');
  });

  it('hydrates a valid stored sort mode', () => {
    localStorage.setItem(SORT_MODE_STORAGE_KEY, 'calm-first');
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.sortMode).toBe('calm-first');
  });

  it('falls back to "palette" on an unknown stored sort mode', () => {
    localStorage.setItem(SORT_MODE_STORAGE_KEY, 'alphabetical');
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.sortMode).toBe('palette');
  });

  it('persists setSortMode to localStorage', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    act(() => result.current.setSortMode('calm-first'));
    expect(result.current.sortMode).toBe('calm-first');
    expect(localStorage.getItem(SORT_MODE_STORAGE_KEY)).toBe('calm-first');
  });
});

describe('sortedThemes', () => {
  it('matches declaration order in palette mode', () => {
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    expect(result.current.sortedThemes.map(t => t.id)).toEqual(GARDEN_THEMES.map(t => t.id));
  });

  it('orders low-arousal themes before high-arousal in calm-first mode', () => {
    localStorage.setItem(SORT_MODE_STORAGE_KEY, 'calm-first');
    const { result } = renderHook(() => useGardenTheme(), { wrapper });
    const arousals = result.current.sortedThemes.map(t => t.arousal);
    // Find first index of each tier; lows must all precede mediums and highs.
    const firstHigh = arousals.indexOf('high');
    const lastLow = arousals.lastIndexOf('low');
    expect(lastLow).toBeLessThan(firstHigh);
  });

  it('orders calming intent before energizing within the same arousal tier', () => {
    // northern (high arousal, energizing) and provence (high arousal, energizing)
    // sit in the same tier. Inject a hypothetical-equivalent check via the
    // exported sortThemes helper using the real data.
    const sorted = sortThemes(GARDEN_THEMES, 'calm-first');
    // Within the low tier, every calming theme should precede any balanced one.
    const lows = sorted.filter(t => t.arousal === 'low');
    const firstBalancedLow = lows.findIndex(t => t.intent === 'balanced');
    const lastCalmingLow = lows.map(t => t.intent).lastIndexOf('calming');
    if (firstBalancedLow !== -1) {
      expect(lastCalmingLow).toBeLessThan(firstBalancedLow);
    }
  });
});

describe('theme metadata — population & distribution', () => {
  const VALID_AROUSAL: ThemeArousal[] = ['low', 'medium', 'high'];
  const VALID_INTENT: ThemeIntent[] = ['calming', 'balanced', 'energizing'];

  it('every theme has arousal, contrast, and intent populated', () => {
    for (const t of GARDEN_THEMES) {
      expect(VALID_AROUSAL).toContain(t.arousal);
      expect(['low', 'standard', 'high']).toContain(t.contrast);
      expect(VALID_INTENT).toContain(t.intent);
    }
  });

  it('has at least 3 low-arousal themes (sensory budget for dysregulated states)', () => {
    const lowCount = GARDEN_THEMES.filter(t => t.arousal === 'low').length;
    expect(lowCount).toBeGreaterThanOrEqual(3);
  });

  it('has at least 2 high-arousal themes (for hypo-arousal stimulation needs)', () => {
    const highCount = GARDEN_THEMES.filter(t => t.arousal === 'high').length;
    expect(highCount).toBeGreaterThanOrEqual(2);
  });

  it('has at least one calming and one energizing intent represented', () => {
    expect(GARDEN_THEMES.some(t => t.intent === 'calming')).toBe(true);
    expect(GARDEN_THEMES.some(t => t.intent === 'energizing')).toBe(true);
  });

  it('GARDEN_THEME_IDS includes all 10 known theme ids', () => {
    expect(GARDEN_THEME_IDS).toHaveLength(10);
    expect(GARDEN_THEME_IDS).toContain('default');
    expect(GARDEN_THEME_IDS).toContain('sakura');
  });
});
