import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { GardenThemeSelector } from './GardenThemeSelector';
import { GardenThemeProvider, STORAGE_KEY, SORT_MODE_STORAGE_KEY, GARDEN_THEMES } from '@/contexts/GardenThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type { ReactNode } from 'react';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
});

afterEach(() => {
  document.documentElement.className = '';
});

const Wrap = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>
    <GardenThemeProvider>{children}</GardenThemeProvider>
  </LanguageProvider>
);

function openSelector() {
  // The trigger button has the Palette icon and "Theme" / "Thème" text.
  const trigger = screen.getByRole('button', { name: /Th[èe]me|Theme|Tema/i });
  fireEvent.click(trigger);
}

describe('GardenThemeSelector', () => {
  it('renders all 10 theme cards when the dialog opens', () => {
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const cards = screen.getAllByRole('button').filter(b => b.hasAttribute('data-theme-id'));
    expect(cards).toHaveLength(GARDEN_THEMES.length);
    expect(cards).toHaveLength(10);
  });

  it('clicking a swatch sets that theme and closes the dialog', () => {
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const sakuraCard = screen.getAllByRole('button').find(b => b.getAttribute('data-theme-id') === 'sakura');
    expect(sakuraCard).toBeDefined();
    if (!sakuraCard) throw new Error('sakura card not found');
    fireEvent.click(sakuraCard);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('sakura');
    // Dialog should close — no more theme cards rendered.
    expect(document.querySelectorAll('[data-theme-id]').length).toBe(0);
  });

  it('marks the currently-active theme with aria-pressed=true', () => {
    localStorage.setItem(STORAGE_KEY, 'forest');
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const forestCard = screen.getAllByRole('button').find(b => b.getAttribute('data-theme-id') === 'forest');
    expect(forestCard?.getAttribute('aria-pressed')).toBe('true');
    const sakuraCard = screen.getAllByRole('button').find(b => b.getAttribute('data-theme-id') === 'sakura');
    expect(sakuraCard?.getAttribute('aria-pressed')).toBe('false');
  });

  it('sort-mode toggle button is present and starts in palette mode by default', () => {
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const sortBtn = document.querySelector('[data-sort-mode]') as HTMLElement | null;
    expect(sortBtn).not.toBeNull();
    expect(sortBtn?.getAttribute('data-sort-mode')).toBe('palette');
  });

  it('clicking the sort-mode toggle switches to calm-first and persists', () => {
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const sortBtn = document.querySelector('[data-sort-mode]') as HTMLElement;
    fireEvent.click(sortBtn);
    const sortBtnAfter = document.querySelector('[data-sort-mode]') as HTMLElement;
    expect(sortBtnAfter.getAttribute('data-sort-mode')).toBe('calm-first');
    expect(localStorage.getItem(SORT_MODE_STORAGE_KEY)).toBe('calm-first');
  });

  it('calm-first mode renders low-arousal themes before high-arousal in the DOM', () => {
    localStorage.setItem(SORT_MODE_STORAGE_KEY, 'calm-first');
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const orderedIds = Array.from(document.querySelectorAll('[data-theme-id]'))
      .map(el => el.getAttribute('data-theme-id') ?? '');
    const firstHighIdx = orderedIds.findIndex(id => {
      const info = GARDEN_THEMES.find(t => t.id === id);
      return info?.arousal === 'high';
    });
    const lastLowIdx = (() => {
      let idx = -1;
      orderedIds.forEach((id, i) => {
        const info = GARDEN_THEMES.find(t => t.id === id);
        if (info?.arousal === 'low') idx = i;
      });
      return idx;
    })();
    expect(lastLowIdx).toBeGreaterThanOrEqual(0);
    expect(firstHighIdx).toBeGreaterThanOrEqual(0);
    expect(lastLowIdx).toBeLessThan(firstHighIdx);
  });

  it('palette mode renders themes in declaration order', () => {
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const orderedIds = Array.from(document.querySelectorAll('[data-theme-id]'))
      .map(el => el.getAttribute('data-theme-id') ?? '');
    expect(orderedIds).toEqual(GARDEN_THEMES.map(t => t.id));
  });

  it('every theme card exposes its arousal in a data attribute (for hooks/tests/CSS)', () => {
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const cards = Array.from(document.querySelectorAll('[data-theme-id]')) as HTMLElement[];
    for (const card of cards) {
      const arousal = card.getAttribute('data-arousal');
      expect(['low', 'medium', 'high']).toContain(arousal);
    }
  });

  it('aria-label includes intent and arousal for screen reader context', () => {
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    const cards = Array.from(document.querySelectorAll('[data-theme-id]')) as HTMLElement[];
    for (const card of cards) {
      const label = card.getAttribute('aria-label') ?? '';
      expect(label).toMatch(/(calming|balanced|energizing)/);
      expect(label).toMatch(/(low|medium|high) arousal/);
    }
  });

  it('renders the dialog title in the active language', () => {
    render(<Wrap><GardenThemeSelector /></Wrap>);
    openSelector();
    // Default pair: primary=en, target=fr → title.primary is "Choisir un jardin"
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Choisir un jardin/)).toBeInTheDocument();
  });
});
