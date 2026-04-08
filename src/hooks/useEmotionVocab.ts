import { useState, useCallback, useMemo } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { EMOTION_SUGGESTIONS, EmotionWord, EmotionSuggestion } from '@/types/journal';

const STORAGE_KEY = 'outputfirst_emotion_vocab';
const CATEGORIES_PER_SESSION = 4;
const WORDS_PER_CATEGORY = 4;

interface VocabState {
  encountered: string[]; // word keys (en)
  used: Record<string, number>; // word key -> use count
  lastSeen: Record<string, string>; // word key -> ISO date
}

function loadState(): VocabState {
  return pipe(
    O.fromNullable(localStorage.getItem(STORAGE_KEY)),
    O.flatMap(raw => {
      try { return O.some(JSON.parse(raw) as VocabState); }
      catch { return O.none; }
    }),
    O.getOrElse((): VocabState => ({ encountered: [], used: {}, lastSeen: {} })),
  );
}

function saveState(state: VocabState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Deterministic seed from day-of-year */
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Simple seeded shuffle using day-of-year */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface SessionCategory {
  category: string;
  categoryFr: string;
  categoryEs: string;
  categoryZhHans?: string;
  categoryZhHant?: string;
  emotions: EmotionWord[];
}

export interface VocabStats {
  totalEncountered: number;
  totalUsed: number;
  totalAvailable: number;
}

export function useEmotionVocab() {
  const [state, setState] = useState<VocabState>(loadState);

  const allWords = useMemo(() => 
    EMOTION_SUGGESTIONS.flatMap(g => g.emotions),
    []
  );

  const getSessionWords = useCallback((): SessionCategory[] => {
    const day = getDayOfYear();
    // Rotate categories: pick 4 of 8, alternating so all appear within 2 days
    const categoryIndices = Array.from({ length: EMOTION_SUGGESTIONS.length }, (_, i) => i);
    const shuffled = seededShuffle(categoryIndices, day);
    const selectedIndices = shuffled.slice(0, CATEGORIES_PER_SESSION);

    return selectedIndices.map(ci => {
      const group = EMOTION_SUGGESTIONS[ci];
      const words = group.emotions;
      
      // Split into used (retrieval) and new/rarely-seen (expansion)
      const usedWords = words.filter(w => (state.used[w.en] || 0) > 0);
      const newWords = words.filter(w => (state.used[w.en] || 0) === 0);

      // Pick 2 used (retrieval) + 2 new (expansion), fill as needed
      const retrieval = seededShuffle(usedWords, day + ci).slice(0, 2);
      const expansion = seededShuffle(newWords, day + ci + 100).slice(0, WORDS_PER_CATEGORY - retrieval.length);
      
      // If we still need more, fill from whichever pool has leftovers
      let selected = [...retrieval, ...expansion];
      if (selected.length < WORDS_PER_CATEGORY) {
        const remaining = words.filter(w => !selected.some(s => s.en === w.en));
        selected = [...selected, ...seededShuffle(remaining, day + ci + 200).slice(0, WORDS_PER_CATEGORY - selected.length)];
      }

      return {
        category: group.category,
        categoryFr: group.categoryFr,
        categoryEs: group.categoryEs,
        categoryZhHans: group.categoryZhHans,
        categoryZhHant: group.categoryZhHant,
        emotions: selected,
      };
    });
  }, [state]);

  const markEncountered = useCallback((words: EmotionWord[]) => {
    setState(prev => {
      const today = new Date().toISOString().split('T')[0];
      const newEncountered = new Set(prev.encountered);
      const newLastSeen = { ...prev.lastSeen };
      
      words.forEach(w => {
        newEncountered.add(w.en);
        newLastSeen[w.en] = today;
      });

      const next = {
        ...prev,
        encountered: Array.from(newEncountered),
        lastSeen: newLastSeen,
      };
      saveState(next);
      return next;
    });
  }, []);

  const markUsed = useCallback((words: EmotionWord[]) => {
    setState(prev => {
      const newUsed = { ...prev.used };
      words.forEach(w => {
        newUsed[w.en] = (newUsed[w.en] || 0) + 1;
      });

      const next = { ...prev, used: newUsed };
      saveState(next);
      return next;
    });
  }, []);

  const isFirstEncounter = useCallback((word: EmotionWord): boolean => {
    return !state.encountered.includes(word.en);
  }, [state.encountered]);

  const stats: VocabStats = useMemo(() => ({
    totalEncountered: state.encountered.length,
    totalUsed: Object.keys(state.used).length,
    totalAvailable: allWords.length,
  }), [state, allWords]);

  const getVocabularyContext = useCallback(() => {
    const recentlyLearned = state.encountered
      .filter(w => {
        const lastSeen = state.lastSeen[w];
        if (!lastSeen) return false;
        const daysSince = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });

    return {
      encountered: state.encountered,
      used: Object.keys(state.used),
      recentlyLearned,
    };
  }, [state]);

  return {
    getSessionWords,
    markEncountered,
    markUsed,
    isFirstEncounter,
    stats,
    getVocabularyContext,
  };
}
