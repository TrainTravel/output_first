import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { useJournal } from './useJournal';
import { LanguageProvider, useLanguage, DEFAULT_PROFILE_ID } from '@/contexts/LanguageContext';
import { profileKey } from './useProfileStorage';

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(LanguageProvider, null, children),
    );
}

/** Legacy key — still tested via the one-shot migration path. */
const LEGACY_STORAGE_KEY = 'outputfirst_entries';
/** New per-profile storage key for the default profile. */
const STORAGE_KEY = profileKey(DEFAULT_PROFILE_ID, 'entries');

function loadEntries() {
  return pipe(
    O.fromNullable(localStorage.getItem(STORAGE_KEY)),
    O.flatMap(stored => {
      try { return O.some(JSON.parse(stored)); }
      catch (e) { return O.none; }
    }),
  );
}

describe('useJournal — localStorage load', () => {
  beforeEach(() => localStorage.clear());

  it('returns None when no entries stored', () => {
    expect(O.isNone(loadEntries())).toBe(true);
  });

  it('returns Some with parsed entries when stored', () => {
    const entries = [{ id: '1', date: '2026-03-01', content: 'hello', createdAt: new Date().toISOString() }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    const result = loadEntries();
    expect(O.isSome(result)).toBe(true);
    if (O.isSome(result)) expect(result.value).toHaveLength(1);
  });

  it('returns None when stored data is malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{{broken');
    expect(O.isNone(loadEntries())).toBe(true);
  });
});

describe('useJournal — per-profile isolation', () => {
  beforeEach(() => localStorage.clear());

  it('entries written under profile A do not appear under profile B', () => {
    // Seed profile state with two profiles, default active.
    localStorage.setItem('outputfirst_profiles', JSON.stringify({
      profiles: [
        { id: DEFAULT_PROFILE_ID, primary: 'en', target: 'fr', createdAt: '2026-05-27T00:00:00.000Z' },
        { id: 'profile-b', primary: 'en', target: 'es', createdAt: '2026-05-27T00:00:00.000Z' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }));

    // Render BOTH useJournal and useLanguage in the same hook so we can switch.
    const useBoth = () => ({ journal: useJournal(), lang: useLanguage() });
    const { result } = renderHook(useBoth, { wrapper: makeWrapper() });

    // Write an entry under profile A.
    act(() => result.current.journal.startFreeWrite());
    act(() => result.current.journal.saveFreeContent('apple banana cherry'));
    expect(result.current.journal.totalWords).toBe(3);

    // Switch to profile B — should see zero entries.
    act(() => result.current.lang.switchProfile('profile-b'));
    expect(result.current.journal.totalWords).toBe(0);

    // Write a different entry under B.
    act(() => result.current.journal.startFreeWrite());
    act(() => result.current.journal.saveFreeContent('one two'));
    expect(result.current.journal.totalWords).toBe(2);

    // Back to A — A's count is unchanged.
    act(() => result.current.lang.switchProfile(DEFAULT_PROFILE_ID));
    expect(result.current.journal.totalWords).toBe(3);

    // Verify each lives at its own prefixed key.
    const aRaw = localStorage.getItem(profileKey(DEFAULT_PROFILE_ID, 'entries'));
    const bRaw = localStorage.getItem(profileKey('profile-b', 'entries'));
    expect(JSON.parse(aRaw!)).toHaveLength(1);
    expect(JSON.parse(bRaw!)).toHaveLength(1);
  });

  it('one-shot legacy migration: outputfirst_entries → default profile key', () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify([
      { id: 'legacy-1', date: today, content: 'word one two three four', createdAt: new Date().toISOString() },
    ]));

    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });

    // Legacy entry was migrated and is visible via the hook.
    expect(result.current.totalWords).toBe(5);
    // Legacy key was cleaned up.
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    // Migration flag set.
    expect(localStorage.getItem('outputfirst_profile_migrated_entries')).toBe('true');
    // Data lives at the prefixed key.
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);
  });
});

describe('useJournal — date string safety', () => {
  it('split("T")?.[0] never throws even on unexpected input', () => {
    const safe = (s: string) => s.split('T')?.[0] ?? '';
    expect(safe(new Date().toISOString())).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(safe('')).toBe('');
  });
});

describe('useJournal — prompt flow steps', () => {
  beforeEach(() => localStorage.clear());

  it('finishBreathe goes to promptchoice', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startJournal());
    act(() => result.current.finishBreathe());
    expect(result.current.currentStep).toBe('promptchoice');
  });

  it('chooseDirect goes to write', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startJournal());
    act(() => result.current.finishBreathe());
    act(() => result.current.chooseDirect());
    expect(result.current.currentStep).toBe('write');
  });

  it('openPromptLibrary goes to promptlibrary', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startJournal());
    act(() => result.current.finishBreathe());
    act(() => result.current.openPromptLibrary());
    expect(result.current.currentStep).toBe('promptlibrary');
  });

  it('pickPrompt sets template and goes to write', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startJournal());
    act(() => result.current.finishBreathe());
    act(() => result.current.openPromptLibrary());
    act(() => result.current.pickPrompt('Today I feel ___ because ___.'));
    expect(result.current.promptTemplate).toBe('Today I feel ___ because ___.');
    expect(result.current.currentStep).toBe('write');
  });

  it('startJournal clears promptTemplate from previous session', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startJournal());
    act(() => result.current.finishBreathe());
    act(() => result.current.pickPrompt('Some template'));
    act(() => result.current.startJournal());
    expect(result.current.promptTemplate).toBe('');
  });
});

describe('useJournal — free write flow', () => {
  beforeEach(() => localStorage.clear());

  it('startFreeWrite goes to freewritechoice (the plain-vs-expressive picker)', () => {
    // startFreeWrite now lands on a choice screen between plain and
    // expressive free write. startPlainFreeWrite() (called from the
    // choice screen) is what ultimately routes to 'freewrite'.
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startFreeWrite());
    expect(result.current.currentStep).toBe('freewritechoice');
  });

  it('startPlainFreeWrite from freewritechoice goes to freewrite', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startFreeWrite());          // → freewritechoice
    act(() => result.current.startPlainFreeWrite());     // → freewrite
    expect(result.current.currentStep).toBe('freewrite');
  });

  it('saveFreeContent saves entry and goes to complete', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startFreeWrite());
    act(() => result.current.saveFreeContent('This is a free write entry.'));
    expect(result.current.currentStep).toBe('complete');
  });

  it('saveFreeContent entry has correct wordCount', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startFreeWrite());
    act(() => result.current.saveFreeContent('one two three four five'));
    expect(result.current.totalWords).toBe(5);
  });
});

describe('useJournal — totalWords and earnedBadges', () => {
  beforeEach(() => localStorage.clear());

  it('totalWords is 0 with no entries', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    expect(result.current.totalWords).toBe(0);
  });

  it('totalWords sums content and gratitude across entries', () => {
    const entry = {
      id: 'seed-1',
      date: '2026-03-01',
      content: 'word1 word2 word3',
      gratitude: 'word4 word5',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry]));
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    expect(result.current.totalWords).toBe(5);
  });

  it('earnedBadges is empty below 50 words', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startFreeWrite());
    act(() => result.current.saveFreeContent('only three words'));
    expect(result.current.earnedBadges).toHaveLength(0);
  });

  it('earns seedling badge at exactly 50 words', () => {
    const content = Array(50).fill('word').join(' ');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: 'e1', date: '2026-03-01', content, createdAt: new Date().toISOString() },
    ]));
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    expect(result.current.earnedBadges.some(b => b.id === 'seedling')).toBe(true);
    expect(result.current.earnedBadges.some(b => b.id === 'writer')).toBe(false);
  });

  it('earns seedling and writer at 200 words, not voice', () => {
    const content = Array(200).fill('word').join(' ');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: 'e1', date: '2026-03-01', content, createdAt: new Date().toISOString() },
    ]));
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    expect(result.current.earnedBadges.some(b => b.id === 'seedling')).toBe(true);
    expect(result.current.earnedBadges.some(b => b.id === 'writer')).toBe(true);
    expect(result.current.earnedBadges.some(b => b.id === 'voice')).toBe(false);
  });
});

describe('useJournal — reflection cycle accumulation', () => {
  beforeEach(() => localStorage.clear());

  it('stores aiQuestion and aiReflection in reflectionCycles', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });

    act(() => result.current.startJournal());
    act(() => result.current.saveContent('I feel stressed today.'));
    act(() => result.current.saveEmotion('tired', 'fatigué(e)'));
    act(() => result.current.continueFromReflection(
      'I notice tension in my shoulders.',
      false,
      'How does that show up in your body?',
      'It sounds like you need rest.',
    ));

    expect(result.current.reflectionCycles).toHaveLength(1);
    expect(result.current.reflectionCycles[0]).toMatchObject({
      reflectionResponse: 'I notice tension in my shoulders.',
      aiQuestion: 'How does that show up in your body?',
      aiReflection: 'It sounds like you need rest.',
    });
  });

  it('accumulates multiple cycles in order', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });

    act(() => result.current.startJournal());
    act(() => result.current.saveContent('Rough week.'));
    act(() => result.current.saveEmotion('overwhelmed', 'submergé(e)'));

    act(() => result.current.continueFromReflection('A lot of deadlines.', false, 'Question 1', 'Reflection 1'));
    act(() => result.current.continueFromReflection('I keep forgetting breaks.', false, 'Question 2', 'Reflection 2'));

    expect(result.current.reflectionCycles).toHaveLength(2);
    expect(result.current.reflectionCycles[0].aiQuestion).toBe('Question 1');
    expect(result.current.reflectionCycles[1].aiQuestion).toBe('Question 2');
    expect(result.current.reflectionCycles[1].reflectionResponse).toBe('I keep forgetting breaks.');
  });

  it('omits aiQuestion/aiReflection when not provided (skip path)', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });

    act(() => result.current.startJournal());
    act(() => result.current.saveContent('Short entry.'));
    act(() => result.current.saveEmotion('calm', 'calme'));
    act(() => result.current.continueFromReflection(undefined, true));

    expect(result.current.reflectionCycles).toHaveLength(1);
    expect(result.current.reflectionCycles[0].reflectionResponse).toBeUndefined();
    expect(result.current.reflectionCycles[0].aiQuestion).toBeUndefined();
  });
});

describe('useJournal — self-compassion step routing', () => {
  beforeEach(() => localStorage.clear());

  it('continueFromReflection(moveToGratitude=true) routes to selfcompassion, not gratitude', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });

    act(() => result.current.startJournal());
    act(() => result.current.saveContent('Today felt heavy.'));
    act(() => result.current.saveEmotion('overwhelmed', 'submergé(e)'));
    act(() => result.current.continueFromReflection('A lot is happening.', true));

    expect(result.current.currentStep).toBe('selfcompassion');
  });

  it('reaching MAX_CYCLES routes to selfcompassion', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });

    act(() => result.current.startJournal());
    act(() => result.current.saveContent('Exploring deeply.'));
    act(() => result.current.saveEmotion('curious', 'curieux/se'));

    // Drive 5 cycles without choosing moveToGratitude — last cycle should land on selfcompassion.
    for (let i = 0; i < 5; i++) {
      act(() => result.current.continueFromReflection(`response ${i}`, false));
    }

    expect(result.current.currentStep).toBe('selfcompassion');
  });

  it('finishSelfCompassion routes from selfcompassion to gratitude', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });

    act(() => result.current.startJournal());
    act(() => result.current.saveContent('Done exploring.'));
    act(() => result.current.saveEmotion('peaceful', 'paisible'));
    act(() => result.current.continueFromReflection(undefined, true));
    expect(result.current.currentStep).toBe('selfcompassion');

    act(() => result.current.finishSelfCompassion());
    expect(result.current.currentStep).toBe('gratitude');
  });
});

describe('useJournal — Center choice (Breathe vs Body Scan) routing', () => {
  beforeEach(() => localStorage.clear());

  it('startJournal lands on centerchoice, not directly on breathe', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startJournal());
    expect(result.current.currentStep).toBe('centerchoice');
  });

  it('chooseBreathe advances to breathe step (existing pre-write flow preserved)', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startJournal());
    act(() => result.current.chooseBreathe());
    expect(result.current.currentStep).toBe('breathe');
    act(() => result.current.finishBreathe());
    expect(result.current.currentStep).toBe('promptchoice');
  });

  it('chooseBodyScan from journal flow → bodyscan → finishBodyScan → promptchoice', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startJournal());
    act(() => result.current.chooseBodyScan());
    expect(result.current.currentStep).toBe('bodyscan');
    act(() => result.current.finishBodyScan());
    // Came from the journal flow → continue forward
    expect(result.current.currentStep).toBe('promptchoice');
  });

  it('openBodyScan from HomeScreen "More tools" → bodyscan → finishBodyScan → home', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    // No startJournal — entering directly from home tools shortcut
    act(() => result.current.openBodyScan());
    expect(result.current.currentStep).toBe('bodyscan');
    act(() => result.current.finishBodyScan());
    // Came from home → bounce back to home, not into the journal flow
    expect(result.current.currentStep).toBe('home');
  });

  it('origin tracking: most recent opener wins (home → journal switches the destination)', () => {
    // Regression guard: if a user opens Body Scan from home tools, abandons it,
    // then later starts journal and picks Body Scan again, the "journal" origin
    // must be the one finishBodyScan honors.
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.openBodyScan());          // origin = 'home'
    act(() => result.current.goHome());                // bail out
    act(() => result.current.startJournal());
    act(() => result.current.chooseBodyScan());        // origin = 'journal'
    act(() => result.current.finishBodyScan());
    expect(result.current.currentStep).toBe('promptchoice');
  });
});
