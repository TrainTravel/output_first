export interface ReflectionCycle {
  emotion?: string;
  emotionFr?: string;
  aiReflection?: string;
  aiQuestion?: string;
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

export type JournalStep = 'home' | 'breathe' | 'write' | 'feedback' | 'emotions' | 'reflection' | 'gratitude' | 'complete' | 'chat' | 'braindump' | 'thoughtgarden' | 'clusters' | 'clusterdetail' | 'zengarden';

export const MIN_CYCLES = 1; // Users can choose to stop after first cycle
export const MAX_CYCLES = 5;

export interface BilingualPrompt {
  en: string;
  fr: string;
}

export interface EmotionWord {
  en: string;
  fr: string;
  es: string;
  nuance: string;
}

export interface EmotionSuggestion {
  category: string;
  categoryFr: string;
  categoryEs: string;
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
    categoryEs: "Calmado",
    emotions: [
      { en: "peaceful", fr: "paisible", es: "tranquilo/a", nuance: "A deep stillness, free from disturbance" },
      { en: "content", fr: "satisfait(e)", es: "contento/a", nuance: "Quietly satisfied with how things are" },
      { en: "relaxed", fr: "détendu(e)", es: "relajado/a", nuance: "Tension has left your body and mind" },
      { en: "settled", fr: "apaisé(e)", es: "calmado/a", nuance: "Things feel resolved or in place" },
      { en: "serene", fr: "serein(e)", es: "sereno/a", nuance: "Calm and untroubled, like still water" },
      { en: "grounded", fr: "ancré(e)", es: "arraigado/a", nuance: "Connected to the present, stable" },
    ],
  },
  {
    category: "Uncertain",
    categoryFr: "Incertain",
    categoryEs: "Inseguro",
    emotions: [
      { en: "unsure", fr: "incertain(e)", es: "inseguro/a", nuance: "Lacking confidence about what to do or think" },
      { en: "hesitant", fr: "hésitant(e)", es: "vacilante", nuance: "Pausing before acting, not quite ready" },
      { en: "questioning", fr: "interrogatif/ive", es: "cuestionando", nuance: "Actively wondering, seeking clarity" },
      { en: "searching", fr: "en quête", es: "buscando", nuance: "Looking for something you haven't found yet" },
      { en: "ambivalent", fr: "ambivalent(e)", es: "ambivalente", nuance: "Pulled in two directions at once" },
      { en: "torn", fr: "tiraillé(e)", es: "dividido/a", nuance: "Conflicted between competing feelings or choices" },
    ],
  },
  {
    category: "Heavy",
    categoryFr: "Lourd",
    categoryEs: "Pesado",
    emotions: [
      { en: "tired", fr: "fatigué(e)", es: "cansado/a", nuance: "Needing rest, energy is low" },
      { en: "weary", fr: "las/lasse", es: "agotado/a", nuance: "Tired from sustained effort or worry" },
      { en: "drained", fr: "épuisé(e)", es: "sin energía", nuance: "Emptied out, nothing left to give" },
      { en: "low", fr: "abattu(e)", es: "decaído/a", nuance: "Spirits are down, subdued mood" },
      { en: "overwhelmed", fr: "submergé(e)", es: "abrumado/a", nuance: "Too much is happening to process" },
      { en: "burdened", fr: "accablé(e)", es: "agobiado/a", nuance: "Carrying a weight that feels too heavy" },
    ],
  },
  {
    category: "Light",
    categoryFr: "Léger",
    categoryEs: "Ligero",
    emotions: [
      { en: "hopeful", fr: "plein(e) d'espoir", es: "esperanzado/a", nuance: "Sensing that something good is possible" },
      { en: "curious", fr: "curieux/se", es: "curioso/a", nuance: "Drawn to learn or explore something" },
      { en: "grateful", fr: "reconnaissant(e)", es: "agradecido/a", nuance: "Appreciating what you have or received" },
      { en: "present", fr: "présent(e)", es: "presente", nuance: "Fully here, not lost in past or future" },
      { en: "energized", fr: "dynamisé(e)", es: "energizado/a", nuance: "Feeling a surge of vitality or motivation" },
      { en: "inspired", fr: "inspiré(e)", es: "inspirado/a", nuance: "Moved to create or act by something meaningful" },
    ],
  },
  {
    category: "Tender",
    categoryFr: "Tendre",
    categoryEs: "Tierno",
    emotions: [
      { en: "vulnerable", fr: "vulnérable", es: "vulnerable", nuance: "Open and exposed, emotionally unguarded" },
      { en: "moved", fr: "ému(e)", es: "conmovido/a", nuance: "Touched deeply by something you witnessed or felt" },
      { en: "nostalgic", fr: "nostalgique", es: "nostálgico/a", nuance: "A bittersweet longing for something past" },
      { en: "tender", fr: "attendri(e)", es: "enternecido/a", nuance: "Softened by affection or compassion" },
      { en: "compassionate", fr: "compatissant(e)", es: "compasivo/a", nuance: "Feeling for another's pain or struggle" },
      { en: "wistful", fr: "mélancolique", es: "melancólico/a", nuance: "Gently sad, wishing for something distant" },
    ],
  },
  {
    category: "Frustrated",
    categoryFr: "Frustré",
    categoryEs: "Frustrado",
    emotions: [
      { en: "irritated", fr: "irrité(e)", es: "irritado/a", nuance: "Mildly angered by something small but persistent" },
      { en: "impatient", fr: "impatient(e)", es: "impaciente", nuance: "Wanting something to happen faster" },
      { en: "stuck", fr: "bloqué(e)", es: "atascado/a", nuance: "Unable to move forward despite effort" },
      { en: "restless", fr: "agité(e)", es: "inquieto/a", nuance: "Can't settle, needing change or movement" },
      { en: "exasperated", fr: "exaspéré(e)", es: "exasperado/a", nuance: "Frustrated to the point of giving up" },
      { en: "defeated", fr: "vaincu(e)", es: "derrotado/a", nuance: "Feeling like your efforts haven't been enough" },
    ],
  },
  {
    category: "Anxious",
    categoryFr: "Anxieux",
    categoryEs: "Ansioso",
    emotions: [
      { en: "nervous", fr: "nerveux/se", es: "nervioso/a", nuance: "On edge about something upcoming" },
      { en: "apprehensive", fr: "appréhensif/ive", es: "aprensivo/a", nuance: "Anticipating something with unease" },
      { en: "on-edge", fr: "sur les nerfs", es: "al límite", nuance: "Hyper-alert, easily startled" },
      { en: "scattered", fr: "dispersé(e)", es: "disperso/a", nuance: "Thoughts racing in many directions" },
      { en: "uneasy", fr: "mal à l'aise", es: "incómodo/a", nuance: "Something feels off but hard to name" },
      { en: "panicked", fr: "paniqué(e)", es: "en pánico", nuance: "Overwhelmed by sudden fear or urgency" },
    ],
  },
  {
    category: "Connected",
    categoryFr: "Connecté",
    categoryEs: "Conectado",
    emotions: [
      { en: "belonging", fr: "un sentiment d'appartenance", es: "pertenencia", nuance: "Feeling part of something larger" },
      { en: "understood", fr: "compris(e)", es: "comprendido/a", nuance: "Someone truly sees what you mean" },
      { en: "supported", fr: "soutenu(e)", es: "apoyado/a", nuance: "Knowing help is there when you need it" },
      { en: "warm", fr: "chaleureux/se", es: "cálido/a", nuance: "A gentle glow of human connection" },
      { en: "included", fr: "inclus(e)", es: "incluido/a", nuance: "Welcomed into a group or conversation" },
      { en: "cherished", fr: "chéri(e)", es: "querido/a", nuance: "Valued deeply by someone" },
    ],
  },
];
