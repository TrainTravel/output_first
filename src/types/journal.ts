export interface ReflectionCycle {
  emotion?: string;
  emotionFr?: string;
  reflectionResponse?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  emotion?: string;
  emotionFr?: string;
  reflectionCycles?: ReflectionCycle[];
  gratitude?: string;
  createdAt: Date;
}

export type JournalStep = 'home' | 'write' | 'feedback' | 'emotions' | 'reflection' | 'gratitude' | 'complete' | 'chat' | 'braindump';

export const MIN_CYCLES = 1; // Users can choose to stop after first cycle
export const MAX_CYCLES = 5;

export interface BilingualPrompt {
  en: string;
  fr: string;
}

export interface EmotionWord {
  en: string;
  fr: string;
}

export interface EmotionSuggestion {
  category: string;
  categoryFr: string;
  emotions: EmotionWord[];
}

export const DAILY_PROMPTS: BilingualPrompt[] = [
  { en: "How are you feeling right now?", fr: "Comment vous sentez-vous en ce moment ?" },
  { en: "What's on your mind today?", fr: "Qu'avez-vous en tête aujourd'hui ?" },
  { en: "Describe a moment from today.", fr: "Décrivez un moment de votre journée." },
  { en: "What's something you noticed recently?", fr: "Qu'avez-vous remarqué récemment ?" },
  { en: "How did today begin for you?", fr: "Comment votre journée a-t-elle commencé ?" },
  { en: "What's taking up space in your thoughts?", fr: "Qu'est-ce qui occupe vos pensées ?" },
];

export const GRATITUDE_PROMPTS: BilingualPrompt[] = [
  { en: "What's one small thing you appreciated today?", fr: "Quelle petite chose avez-vous appréciée aujourd'hui ?" },
  { en: "What moment brought you a bit of peace?", fr: "Quel moment vous a apporté un peu de paix ?" },
  { en: "Who or what made today a little easier?", fr: "Qui ou quoi a rendu votre journée un peu plus facile ?" },
  { en: "What simple comfort did you enjoy?", fr: "Quel petit plaisir avez-vous apprécié ?" },
];

export const EMOTION_SUGGESTIONS: EmotionSuggestion[] = [
  {
    category: "Calm",
    categoryFr: "Calme",
    emotions: [
      { en: "peaceful", fr: "paisible" },
      { en: "content", fr: "satisfait(e)" },
      { en: "relaxed", fr: "détendu(e)" },
      { en: "settled", fr: "apaisé(e)" },
    ],
  },
  {
    category: "Uncertain",
    categoryFr: "Incertain",
    emotions: [
      { en: "unsure", fr: "incertain(e)" },
      { en: "hesitant", fr: "hésitant(e)" },
      { en: "questioning", fr: "interrogatif/ive" },
      { en: "searching", fr: "en quête" },
    ],
  },
  {
    category: "Heavy",
    categoryFr: "Lourd",
    emotions: [
      { en: "tired", fr: "fatigué(e)" },
      { en: "weary", fr: "las/lasse" },
      { en: "drained", fr: "épuisé(e)" },
      { en: "low", fr: "abattu(e)" },
    ],
  },
  {
    category: "Light",
    categoryFr: "Léger",
    emotions: [
      { en: "hopeful", fr: "plein(e) d'espoir" },
      { en: "curious", fr: "curieux/se" },
      { en: "grateful", fr: "reconnaissant(e)" },
      { en: "present", fr: "présent(e)" },
    ],
  },
];
