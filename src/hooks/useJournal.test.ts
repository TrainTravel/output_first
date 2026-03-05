import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { useJournal } from './useJournal';

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const STORAGE_KEY = 'outputfirst_entries';

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

  it('startFreeWrite goes to freewrite', () => {
    const { result } = renderHook(() => useJournal(), { wrapper: makeWrapper() });
    act(() => result.current.startFreeWrite());
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
