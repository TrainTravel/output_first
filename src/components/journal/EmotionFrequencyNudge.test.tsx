import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EmotionFrequencyNudge } from './EmotionFrequencyNudge';
import { LanguageProvider, DEFAULT_PROFILE_ID } from '@/contexts/LanguageContext';
import { profileKey } from '@/hooks/useProfileStorage';
import { EMOTION_VOCAB_KEY } from '@/hooks/useEmotionVocab';
import { FREQ_MIRROR_DISMISS_KEY } from '@/hooks/useFrequencyMirror';

// Vocab and dismissals now live under per-profile namespaced keys.
const VOCAB_KEY = profileKey(DEFAULT_PROFILE_ID, EMOTION_VOCAB_KEY);
const DISMISS_KEY = profileKey(DEFAULT_PROFILE_ID, FREQ_MIRROR_DISMISS_KEY);

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function seedVocab(used: Record<string, number>, lastSeen?: Record<string, string>) {
  const ls = lastSeen
    ?? Object.fromEntries(Object.keys(used).map(k => [k, isoDaysAgo(1)]));
  localStorage.setItem(
    VOCAB_KEY,
    JSON.stringify({ encountered: Object.keys(used), used, lastSeen: ls }),
  );
}

const Wrap = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe('EmotionFrequencyNudge', () => {
  it('renders nothing when no word qualifies', () => {
    const onOpen = vi.fn();
    const { container } = render(
      <Wrap><EmotionFrequencyNudge onOpenVocabulary={onOpen} /></Wrap>,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('freq-mirror-nudge')).toBeNull();
  });

  it('renders nothing for a precise (non-vague) word over threshold', () => {
    seedVocab({ grateful: 12 });
    const { container } = render(
      <Wrap><EmotionFrequencyNudge onOpenVocabulary={vi.fn()} /></Wrap>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the card with the word and count when one qualifies', () => {
    seedVocab({ tired: 6 });
    render(<Wrap><EmotionFrequencyNudge onOpenVocabulary={vi.fn()} /></Wrap>);
    const card = screen.getByTestId('freq-mirror-nudge');
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('tired');
    expect(card.textContent).toContain('6');
  });

  it('clicking dismiss hides the card and writes the dismissal to localStorage', () => {
    seedVocab({ tired: 7 });
    render(<Wrap><EmotionFrequencyNudge onOpenVocabulary={vi.fn()} /></Wrap>);

    expect(screen.queryByTestId('freq-mirror-nudge')).toBeTruthy();
    fireEvent.click(screen.getByTestId('freq-mirror-dismiss'));
    expect(screen.queryByTestId('freq-mirror-nudge')).toBeNull();

    const stored = JSON.parse(localStorage.getItem(DISMISS_KEY)!) as Record<string, string>;
    expect(stored.tired).toBeTruthy();
  });

  it('clicking "See alternatives" calls onOpenVocabulary', () => {
    seedVocab({ tired: 7 });
    const onOpen = vi.fn();
    render(<Wrap><EmotionFrequencyNudge onOpenVocabulary={onOpen} /></Wrap>);

    fireEvent.click(screen.getByTestId('freq-mirror-alternatives'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('dismiss button has an accessible aria-label', () => {
    seedVocab({ tired: 6 });
    render(<Wrap><EmotionFrequencyNudge onOpenVocabulary={vi.fn()} /></Wrap>);
    const dismiss = screen.getByTestId('freq-mirror-dismiss');
    expect(dismiss.getAttribute('aria-label')).toBeTruthy();
  });
});
