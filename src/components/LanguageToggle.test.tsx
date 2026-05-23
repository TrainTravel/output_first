import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageToggle } from './LanguageToggle';
import { LanguageProvider } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'outputfirst_lang_pair';

beforeEach(() => {
  localStorage.clear();
});

describe('LanguageToggle', () => {
  it('renders stacked target + primary letters (default pair en/fr)', () => {
    render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    const button = screen.getByRole('button', { name: /Speaking EN/ });
    expect(button).toHaveTextContent('FR');
    expect(button).toHaveTextContent('EN');
  });

  it('renders no arrow anywhere in the DOM', () => {
    render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    expect(document.body.textContent ?? '').not.toContain('→');
  });

  it('aria-label and title contain no arrow', () => {
    render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    const button = screen.getByRole('button', { name: /Speaking/ });
    expect(button.getAttribute('aria-label') ?? '').not.toContain('→');
    expect(button.getAttribute('title') ?? '').not.toContain('→');
  });

  it('tap flips the primary language', () => {
    render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    const button = screen.getByRole('button', { name: /Speaking EN/ });
    fireEvent.click(button);
    expect(screen.queryByRole('button', { name: /Speaking EN/ })).toBeNull();
  });

  it('renders the gear icon only when onOpenSettings is provided', () => {
    const { rerender } = render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    expect(screen.queryByRole('button', { name: /Language settings/i })).toBeNull();
    rerender(<LanguageProvider><LanguageToggle onOpenSettings={vi.fn()} /></LanguageProvider>);
    expect(screen.getByRole('button', { name: /Language settings/i })).toBeInTheDocument();
  });

  it('localizes verbs + title for primary=fr', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'fr', target: 'es' }));
    render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    const button = screen.getByRole('button', { name: /Parle/ });
    expect(button.getAttribute('title')).toBe('parle FR · apprend ES');
  });

  it('localizes verbs + title for primary=es', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'es', target: 'fr' }));
    render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    const button = screen.getByRole('button', { name: /Hablo/ });
    expect(button.getAttribute('title')).toBe('hablo ES · aprendo FR');
  });

  it('localizes verbs + title for primary=zh-Hans', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hans', target: 'fr' }));
    render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    const button = screen.getByRole('button', { name: /说/ });
    expect(button.getAttribute('title')).toBe('说 简 · 学 FR');
    expect(button.getAttribute('aria-label')).toBe('说简，学FR。点击切换。');
  });

  it('localizes verbs + title for primary=zh-Hant', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: 'zh-Hant', target: 'es' }));
    render(<LanguageProvider><LanguageToggle /></LanguageProvider>);
    const button = screen.getByRole('button', { name: /說/ });
    expect(button.getAttribute('title')).toBe('說 繁 · 學 ES');
    expect(button.getAttribute('aria-label')).toBe('說繁，學ES。點擊切換。');
  });
});
