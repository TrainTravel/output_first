import { useState, useEffect } from 'react';
import { JournalEntry, JournalStep, DAILY_PROMPTS, GRATITUDE_PROMPTS } from '@/types/journal';

const STORAGE_KEY = 'outputfirst_entries';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<JournalStep>('home');
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({});

  // Load entries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEntries(parsed.map((e: JournalEntry) => ({
          ...e,
          createdAt: new Date(e.createdAt),
        })));
      } catch (e) {
        console.error('Failed to load entries:', e);
      }
    }
  }, []);

  // Save entries to localStorage
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries]);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);
  const hasJournaledToday = !!todayEntry;

  // Calculate streak
  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    
    const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    let streak = 0;
    const checkDate = new Date();
    
    for (const dateStr of sortedDates) {
      const entryDate = new Date(dateStr);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      if (dateStr === checkDateStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === new Date(checkDate.setDate(checkDate.getDate())).toISOString().split('T')[0]) {
        // Allow for checking yesterday if today not yet journaled
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();
  const totalDays = new Set(entries.map(e => e.date)).size;

  // Get random prompt
  const getDailyPrompt = () => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  };

  const getGratitudePrompt = () => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return GRATITUDE_PROMPTS[dayOfYear % GRATITUDE_PROMPTS.length];
  };

  const startJournal = () => {
    setCurrentEntry({ date: today });
    setCurrentStep('write');
  };

  const saveContent = (content: string) => {
    setCurrentEntry(prev => ({ ...prev, content }));
    setCurrentStep('emotions');
  };

  const saveEmotion = (emotion?: string) => {
    setCurrentEntry(prev => ({ ...prev, emotion }));
    setCurrentStep('gratitude');
  };

  const saveGratitude = (gratitude?: string) => {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: today,
      content: currentEntry.content || '',
      emotion: currentEntry.emotion,
      gratitude: gratitude,
      createdAt: new Date(),
    };

    setEntries(prev => [...prev, newEntry]);
    setCurrentStep('complete');
  };

  const skipToComplete = () => {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date: today,
      content: currentEntry.content || '',
      emotion: currentEntry.emotion,
      createdAt: new Date(),
    };

    setEntries(prev => [...prev, newEntry]);
    setCurrentStep('complete');
  };

  const goHome = () => {
    setCurrentStep('home');
    setCurrentEntry({});
  };

  const viewProgress = () => {
    setCurrentStep('complete');
  };

  return {
    currentStep,
    currentEntry,
    hasJournaledToday,
    streak,
    totalDays,
    getDailyPrompt,
    getGratitudePrompt,
    startJournal,
    saveContent,
    saveEmotion,
    saveGratitude,
    skipToComplete,
    goHome,
    viewProgress,
  };
}
