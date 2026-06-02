import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { JournalEntry, JournalStep, DAILY_PROMPTS, GRATITUDE_PROMPTS, BilingualPrompt, ReflectionCycle, MIN_CYCLES, MAX_CYCLES, BADGES, Badge, VocabPair } from '@/types/journal';
import { supabase } from '@/integrations/supabase/client';
import { ThoughtContext } from '@/types/chat';
import { useProfileStorage } from './useProfileStorage';
import { hapticSuccess } from '@/lib/haptics';
import { tickEngagement } from './useEngagement';

/** Legacy unprefixed key — migrated to per-profile storage in Phase 1. */
const LEGACY_STORAGE_KEY = 'outputfirst_entries';

/**
 * Internal storage shape — `createdAt` is serialized as an ISO string in
 * localStorage. We re-hydrate it to a `Date` on read for the exposed API
 * so callers don't need to know it ever crossed JSON.
 */
interface StoredJournalEntry extends Omit<JournalEntry, 'createdAt'> {
  createdAt: string | Date;
}

const countWords = (text: string): number =>
  text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

export function useJournal() {
  const queryClient = useQueryClient();
  const [rawEntries, setRawEntries] = useProfileStorage<StoredJournalEntry[]>(
    'entries',
    [],
    { legacyKey: LEGACY_STORAGE_KEY },
  );
  // Rehydrate Date instances so consumers can treat createdAt as a Date.
  const entries = useMemo<JournalEntry[]>(() => rawEntries.map(e => ({
    ...e,
    createdAt: e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt),
  })), [rawEntries]);

  const setEntries = useCallback(
    (next: JournalEntry[] | ((prev: JournalEntry[]) => JournalEntry[])) => {
      setRawEntries(prev => {
        const prevEntries = prev.map(e => ({
          ...e,
          createdAt: e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt),
        })) as JournalEntry[];
        const updated = typeof next === 'function' ? next(prevEntries) : next;
        return updated as StoredJournalEntry[];
      });
    },
    [setRawEntries],
  );

  const [currentStep, setCurrentStep] = useState<JournalStep>('home');
  useEffect(() => {
    if (currentStep === 'complete') tickEngagement();
  }, [currentStep]);
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({});
  const [currentCycle, setCurrentCycle] = useState(0);
  const [reflectionCycles, setReflectionCycles] = useState<ReflectionCycle[]>([]);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<ThoughtContext | null>(null);
  const [vocabOrigin, setVocabOrigin] = useState<JournalStep>('home');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [promptVocab, setPromptVocab] = useState<VocabPair[] | undefined>(undefined);

  const today = new Date().toISOString().split('T')?.[0] ?? '';
  const todayEntry = entries.find(e => e.date === today);
  const hasJournaledToday = !!todayEntry;

  // Calculate streak
  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    
    const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    let streak = 0;
    const checkDate = new Date();
    
    for (const dateStr of sortedDates) {
      const checkDateStr = checkDate.toISOString().split('T')?.[0] ?? '';
      
      if (dateStr === checkDateStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();
  const totalDays = new Set(entries.map(e => e.date)).size;
  const totalWords = entries.reduce((sum, e) =>
    sum + countWords(e.content || '') + countWords(e.gratitude || ''), 0);
  const earnedBadges: Badge[] = BADGES.filter(b => totalWords >= b.threshold);

  // Get random prompt - returns BilingualPrompt
  const getDailyPrompt = (): BilingualPrompt => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  };

  const getGratitudePrompt = (): BilingualPrompt => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return GRATITUDE_PROMPTS[dayOfYear % GRATITUDE_PROMPTS.length];
  };

  const startJournal = () => {
    setCurrentEntry({ date: today });
    setPromptTemplate('');
    setPromptVocab(undefined);
    setCurrentStep('breathe');
    setCurrentCycle(0);
    setReflectionCycles([]);
  };

  const finishBreathe = () => {
    setCurrentStep('promptchoice');
  };

  const chooseDirect = () => setCurrentStep('write');
  const openPromptLibrary = () => setCurrentStep('promptlibrary');
  const pickPrompt = (template: string, vocabulary?: VocabPair[]) => { setPromptTemplate(template); setPromptVocab(vocabulary); setCurrentStep('write'); };

  const startFreeWrite = () => {
    setCurrentEntry({ date: today });
    setPromptTemplate('');
    setCurrentStep('freewritechoice');
  };

  const startPlainFreeWrite = () => {
    setCurrentStep('freewrite');
  };

  const startExpressiveWrite = () => {
    setCurrentStep('expressivewrite');
  };

  const saveFreeContent = (content: string) => {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: today,
      content,
      wordCount: countWords(content),
      createdAt: new Date(),
    };
    setEntries(prev => [...prev, newEntry]);
    persistToDb(newEntry);
    setCurrentStep('complete');
    hapticSuccess();
  };

  const saveContent = (content: string) => {
    setCurrentEntry(prev => ({ ...prev, content }));
    setCurrentStep('feedback');
  };

  const saveExpressiveContent = (content: string) => {
    setCurrentEntry(prev => ({ ...prev, content }));
    setCurrentStep('feedback');
  };

  const skipFeedback = () => {
    setCurrentStep('emotions');
  };

  const continuePastFeedback = () => {
    // After the initial write feedback → emotions.
    // Between reflection rounds (currentCycle > 0) → back to reflection.
    setCurrentStep(currentCycle > 0 ? 'reflection' : 'emotions');
  };

  const saveEmotion = (emotion?: string, emotionFr?: string) => {
    setCurrentEntry(prev => ({ ...prev, emotion, emotionFr }));
    setCurrentStep('reflection');
  };

  const continueFromReflection = (reflectionResponse?: string, moveToGratitude?: boolean, aiQuestion?: string, aiReflection?: string) => {
    // Save this cycle's data
    const cycleData: ReflectionCycle = {
      emotion: currentEntry.emotion,
      emotionFr: currentEntry.emotionFr,
      aiReflection,
      aiQuestion,
      reflectionResponse,
    };
    
    const updatedCycles = [...reflectionCycles, cycleData];
    setReflectionCycles(updatedCycles);
    
    const nextCycle = currentCycle + 1;
    setCurrentCycle(nextCycle);
    
    // If user chose to move to gratitude (after min cycles) or reached max cycles
    if (moveToGratitude || nextCycle >= MAX_CYCLES) {
      setCurrentEntry(prev => ({ ...prev, reflectionCycles: updatedCycles }));
      setCurrentStep('gratitude');
    } else {
      // Continue to next cycle - go back to feedback
      setCurrentStep('feedback');
    }
  };

  const canMoveToGratitude = currentCycle >= MIN_CYCLES - 1; // -1 because we check before incrementing

  const persistToDb = useCallback(async (entry: JournalEntry) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('journal_entries').insert({
          user_id: session.user.id,
          date: entry.date,
          content: entry.content,
          emotion: entry.emotion || null,
          emotion_fr: entry.emotionFr || null,
          gratitude: entry.gratitude || null,
        });
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      }
    } catch (e) {
      console.error('Failed to persist journal entry:', e);
    }
  }, [queryClient]);

  const saveGratitude = (gratitude?: string) => {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: today,
      content: currentEntry.content || '',
      emotion: currentEntry.emotion,
      emotionFr: currentEntry.emotionFr,
      gratitude: gratitude,
      wordCount: countWords(currentEntry.content || '') + countWords(gratitude || ''),
      createdAt: new Date(),
    };

    setEntries(prev => [...prev, newEntry]);
    persistToDb(newEntry);
    setCurrentStep('complete');
    hapticSuccess();
  };

  const skipToComplete = () => {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: today,
      content: currentEntry.content || '',
      emotion: currentEntry.emotion,
      emotionFr: currentEntry.emotionFr,
      createdAt: new Date(),
    };

    setEntries(prev => [...prev, newEntry]);
    persistToDb(newEntry);
    setCurrentStep('complete');
    hapticSuccess();
  };

  const goHome = () => {
    setCurrentStep('home');
    setCurrentEntry({});
    setCurrentCycle(0);
    setReflectionCycles([]);
    setChatContext(null);
  };

  const viewProgress = () => {
    setCurrentStep('complete');
  };

  const openChat = () => {
    setChatContext(null);
    setCurrentStep('chat');
  };

  const openChatWithContext = (context: ThoughtContext) => {
    setChatContext(context);
    setCurrentStep('chat');
  };

  return {
    currentStep,
    currentEntry,
    hasJournaledToday,
    streak,
    totalDays,
    totalWords,
    earnedBadges,
    promptTemplate,
    promptVocab,
    currentCycle,
    reflectionCycles,
    canMoveToGratitude,
    getDailyPrompt,
    getGratitudePrompt,
    startJournal,
    finishBreathe,
    chooseDirect,
    openPromptLibrary,
    pickPrompt,
    startFreeWrite,
    startPlainFreeWrite,
    startExpressiveWrite,
    saveFreeContent,
    saveContent,
    saveExpressiveContent,
    skipFeedback,
    continuePastFeedback,
    saveEmotion,
    continueFromReflection,
    saveGratitude,
    skipToComplete,
    goHome,
    viewProgress,
    openChat,
    openChatWithContext,
    chatContext,
    goBackToWrite: () => setCurrentStep('write'),
    openBrainDump: () => setCurrentStep('braindump'),
    openThoughtGarden: () => setCurrentStep('thoughtgarden'),
    openClusters: () => setCurrentStep('clusters'),
    openClusterDetail: (id: string) => { setActiveClusterId(id); setCurrentStep('clusterdetail'); },
    openZenGarden: () => setCurrentStep('zengarden'),
    openSmallWins: () => setCurrentStep('smallwins'),
    openSandTimer: () => setCurrentStep('sandtimer'),
    openFocusPlan: () => setCurrentStep('focusplan'),
    openTodoList: () => setCurrentStep('todolist'),
    openTinyExperiment: () => setCurrentStep('tinyexperiment'),
    openLanguageSettings: () => setCurrentStep('languagesettings'),
    goBackToEmotions: () => setCurrentStep('emotions'),
    openVocabulary: (from?: JournalStep) => { setVocabOrigin(from || 'home'); setCurrentStep('vocabulary'); },
    vocabOrigin,
    activeClusterId,
  };
}
