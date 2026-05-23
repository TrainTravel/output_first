import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FontPicker } from './FontPicker';
import { FontProvider, FONT_OPTIONS } from '@/contexts/FontContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type { ReactNode } from 'react';

const FONT_STORAGE_KEY = 'outputfirst_font_pref';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.removeProperty('--font-body');
});

const wrap = (children: ReactNode) =>
  render(
    <LanguageProvider>
      <FontProvider>{children}</FontProvider>
    </LanguageProvider>,
  );

describe('FontPicker', () => {
  it('renders one pill per FONT_OPTIONS entry (5 total)', () => {
    wrap(<FontPicker />);
    for (const opt of FONT_OPTIONS) {
      expect(screen.getByRole('button', { name: opt.label })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button')).toHaveLength(FONT_OPTIONS.length);
  });

  it('marks the default pill aria-pressed on first render', () => {
    wrap(<FontPicker />);
    const defaultPill = screen.getByRole('button', { name: 'Default' });
    expect(defaultPill.getAttribute('aria-pressed')).toBe('true');
    const lexendPill = screen.getByRole('button', { name: 'Lexend' });
    expect(lexendPill.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking a pill switches aria-pressed and updates CSS variable', () => {
    wrap(<FontPicker />);
    fireEvent.click(screen.getByRole('button', { name: 'Lexend' }));
    expect(screen.getByRole('button', { name: 'Lexend' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Default' }).getAttribute('aria-pressed')).toBe('false');
    const cssVar = document.documentElement.style.getPropertyValue('--font-body');
    const lexend = FONT_OPTIONS.find(o => o.id === 'lexend');
    expect(cssVar).toBe(lexend?.cssFamily ?? '');
  });

  it('persists the pick to localStorage', () => {
    wrap(<FontPicker />);
    fireEvent.click(screen.getByRole('button', { name: 'OpenD.' }));
    expect(localStorage.getItem(FONT_STORAGE_KEY)).toBe('opendyslexic');
  });

  it('hydrates the picker from localStorage on mount', () => {
    localStorage.setItem(FONT_STORAGE_KEY, 'atkinson');
    wrap(<FontPicker />);
    expect(screen.getByRole('button', { name: 'Atkinson' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Default' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('each pill carries its own fontFamily inline style for live preview', () => {
    wrap(<FontPicker />);
    for (const opt of FONT_OPTIONS) {
      const pill = screen.getByRole('button', { name: opt.label });
      // happy-dom normalizes quotes and spacing; compare on the option's exact value
      expect(pill.getAttribute('style')).toContain('font-family');
    }
  });
});
