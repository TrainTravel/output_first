export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  emotion?: string;
  gratitude?: string;
  createdAt: Date;
}

export type JournalStep = 'home' | 'write' | 'emotions' | 'gratitude' | 'complete';

export interface EmotionSuggestion {
  category: string;
  emotions: string[];
}

export const DAILY_PROMPTS = [
  "How are you feeling right now?",
  "What's on your mind today?",
  "Describe a moment from today.",
  "What's something you noticed recently?",
  "How did today begin for you?",
  "What's taking up space in your thoughts?",
];

export const GRATITUDE_PROMPTS = [
  "What's one small thing you appreciated today?",
  "What moment brought you a bit of peace?",
  "Who or what made today a little easier?",
  "What simple comfort did you enjoy?",
];

export const EMOTION_SUGGESTIONS: EmotionSuggestion[] = [
  {
    category: "Calm",
    emotions: ["peaceful", "content", "relaxed", "settled"],
  },
  {
    category: "Uncertain",
    emotions: ["unsure", "hesitant", "questioning", "searching"],
  },
  {
    category: "Heavy",
    emotions: ["tired", "weary", "drained", "low"],
  },
  {
    category: "Light",
    emotions: ["hopeful", "curious", "grateful", "present"],
  },
];
