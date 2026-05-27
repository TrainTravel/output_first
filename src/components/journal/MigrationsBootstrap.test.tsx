import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LanguageProvider, DEFAULT_PROFILE_ID } from '@/contexts/LanguageContext';
import { profileKey } from '@/hooks/useProfileStorage';
import { EMOTION_VOCAB_KEY } from '@/hooks/useEmotionVocab';
import { MigrationsBootstrap } from './JournalApp';

const LEGACY_EMOTION_VOCAB_KEY = 'outputfirst_emotion_vocab';

beforeEach(() => {
  localStorage.clear();
});

const Wrap = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('MigrationsBootstrap', () => {
  it('migrates legacy outputfirst_emotion_vocab to the default profile on first mount', () => {
    // Seed legacy unprefixed key — simulates a returning user whose data
    // pre-dates the per-profile namespacing.
    const legacy = {
      encountered: ['tired'],
      used: { tired: 7 },
      lastSeen: { tired: '2026-05-20' },
    };
    localStorage.setItem(LEGACY_EMOTION_VOCAB_KEY, JSON.stringify(legacy));

    render(<Wrap><MigrationsBootstrap /></Wrap>);

    // Legacy key removed.
    expect(localStorage.getItem(LEGACY_EMOTION_VOCAB_KEY)).toBeNull();
    // Data now lives at the per-profile prefixed key.
    const prefixed = localStorage.getItem(
      profileKey(DEFAULT_PROFILE_ID, EMOTION_VOCAB_KEY),
    );
    expect(prefixed).not.toBeNull();
    expect(JSON.parse(prefixed!)).toEqual(legacy);
  });
});
