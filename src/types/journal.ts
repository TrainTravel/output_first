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
  wordCount?: number;
  createdAt: Date;
}

export type JournalStep = 'home' | 'breathe' | 'promptchoice' | 'promptlibrary'
  | 'write' | 'feedback' | 'emotions' | 'reflection' | 'gratitude' | 'complete'
  | 'chat' | 'braindump' | 'thoughtgarden' | 'clusters' | 'clusterdetail'
  | 'zengarden' | 'freewrite' | 'freewritechoice' | 'expressivewrite'
  | 'vocabulary' | 'smallwins' | 'sandtimer' | 'focusplan' | 'todolist' | 'tinyexperiment';

export const MIN_CYCLES = 1; // Users can choose to stop after first cycle
export const MAX_CYCLES = 5;

export interface BilingualPrompt {
  en: string;
  fr: string;
}

export type FillInCategory = 'Emotions' | 'Daily Life' | 'Observations' | 'Challenges' | 'Hopes' | 'Situations';

export interface VocabPair {
  fr: string;
  en: string;
}

export interface FillInPrompt {
  id: string;
  category: FillInCategory;
  fr: string;
  en: string;
  es: string;
  vocabulary?: VocabPair[];
}

export interface Badge {
  id: string;
  threshold: number;
  icon: string;
  fr: string;
  en: string;
  es: string;
}

export interface EmotionWord {
  en: string;
  fr: string;
  es: string;
  nuance: string;
  collocations?: string[];
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

export const FILL_IN_PROMPTS: FillInPrompt[] = [
  // Emotions
  { id: 'em1', category: 'Emotions', fr: "Aujourd'hui je me sens ___ parce que ___.", en: "Today I feel ___ because ___.", es: "Hoy me siento ___ porque ___." },
  { id: 'em2', category: 'Emotions', fr: "En ce moment, je remarque ___ dans mon corps.", en: "Right now, I notice ___ in my body.", es: "Ahora mismo, noto ___ en mi cuerpo." },
  { id: 'em3', category: 'Emotions', fr: "Ce qui m'a touché(e) aujourd'hui, c'est ___.", en: "What touched me today was ___.", es: "Lo que me llegó hoy fue ___." },
  // Daily Life
  { id: 'dl1', category: 'Daily Life', fr: "Aujourd'hui j'ai ___ et ça m'a fait ___.", en: "Today I ___ and it made me feel ___.", es: "Hoy yo ___ y eso me hizo sentir ___." },
  { id: 'dl2', category: 'Daily Life', fr: "Un moment que je veux retenir aujourd'hui : ___.", en: "A moment I want to remember from today: ___.", es: "Un momento que quiero recordar de hoy: ___." },
  { id: 'dl3', category: 'Daily Life', fr: "Ce matin je ___, et cet après-midi je ___.", en: "This morning I ___, and this afternoon I ___.", es: "Esta mañana yo ___, y esta tarde yo ___." },
  // Observations
  { id: 'ob1', category: 'Observations', fr: "J'ai remarqué que ___. Ça m'a fait penser à ___.", en: "I noticed that ___. It made me think about ___.", es: "Noté que ___. Me hizo pensar en ___." },
  { id: 'ob2', category: 'Observations', fr: "Quelque chose de petit m'a surpris(e) : ___.", en: "Something small surprised me: ___.", es: "Algo pequeño me sorprendió: ___." },
  { id: 'ob3', category: 'Observations', fr: "Les gens autour de moi ___, et moi je ___.", en: "The people around me ___, and I ___.", es: "La gente a mi alrededor ___, y yo ___." },
  // Challenges
  { id: 'ch1', category: 'Challenges', fr: "J'ai du mal à ___, mais je sais que ___.", en: "I struggle with ___, but I know that ___.", es: "Me cuesta ___, pero sé que ___." },
  { id: 'ch2', category: 'Challenges', fr: "Ce qui me pèse en ce moment c'est ___. Ce qui m'aide c'est ___.", en: "What's weighing on me is ___. What helps is ___.", es: "Lo que me pesa es ___. Lo que me ayuda es ___." },
  { id: 'ch3', category: 'Challenges', fr: "Si je pouvais changer une chose aujourd'hui, ce serait ___.", en: "If I could change one thing today, it would be ___.", es: "Si pudiera cambiar una cosa hoy, sería ___." },
  // Hopes
  { id: 'hp1', category: 'Hopes', fr: "Je suis reconnaissant(e) pour ___ parce que ___.", en: "I'm grateful for ___ because ___.", es: "Estoy agradecido/a por ___ porque ___." },
  { id: 'hp2', category: 'Hopes', fr: "Cette semaine, j'espère ___. Pour ça je vais ___.", en: "This week, I hope to ___. To do that I will ___.", es: "Esta semana, espero ___. Para eso voy a ___." },
  { id: 'hp3', category: 'Hopes', fr: "Un mot qui décrit où je veux être : ___. Parce que ___.", en: "One word for where I want to be: ___. Because ___.", es: "Una palabra para donde quiero estar: ___. Porque ___." },
  // Situations
  { id: 'si1', category: 'Situations', fr: "Décrivez un moment où vous vous êtes senti(e) fier/fière.", en: "Describe a moment you felt proud.", es: "Describe un momento en que te sentiste orgulloso/a.",
    vocabulary: [{ fr: 'fier/fière', en: 'proud' }, { fr: 'accomplissement', en: 'achievement' }, { fr: 'réussir', en: 'to succeed' }] },
  { id: 'si2', category: 'Situations', fr: "Racontez un malentendu récent.", en: "Tell about a recent misunderstanding.", es: "Cuenta un malentendido reciente.",
    vocabulary: [{ fr: 'malentendu', en: 'misunderstanding' }, { fr: 'expliquer', en: 'to explain' }, { fr: 'confus(e)', en: 'confused' }] },
  { id: 'si3', category: 'Situations', fr: "Décrivez un endroit où vous vous sentez en sécurité.", en: "Describe a place where you feel safe.", es: "Describe un lugar donde te sientes seguro/a.",
    vocabulary: [{ fr: 'en sécurité', en: 'safe' }, { fr: 'chaleureux/se', en: 'warm' }, { fr: 'refuge', en: 'shelter' }, { fr: 'paisible', en: 'peaceful' }] },
  { id: 'si4', category: 'Situations', fr: "Parlez d'une fois où vous avez aidé quelqu'un.", en: "Talk about a time you helped someone.", es: "Habla de una vez que ayudaste a alguien.",
    vocabulary: [{ fr: 'aider', en: 'to help' }, { fr: 'reconnaissant(e)', en: 'grateful' }, { fr: 'soutenir', en: 'to support' }] },
  { id: 'si5', category: 'Situations', fr: "Racontez un moment où vous avez dû être courageux/se.", en: "Tell about a moment you had to be brave.", es: "Cuenta un momento en que tuviste que ser valiente.",
    vocabulary: [{ fr: 'courageux/se', en: 'brave' }, { fr: 'surmonter', en: 'to overcome' }, { fr: 'peur', en: 'fear' }, { fr: 'oser', en: 'to dare' }] },
  { id: 'si6', category: 'Situations', fr: "Décrivez un repas qui vous a rendu(e) heureux/se.", en: "Describe a meal that made you happy.", es: "Describe una comida que te hizo feliz.",
    vocabulary: [{ fr: 'délicieux/se', en: 'delicious' }, { fr: 'savourer', en: 'to savor' }, { fr: 'partager', en: 'to share' }] },
];

export const BADGES: Badge[] = [
  { id: 'seedling',    threshold: 50,   icon: '🌱', fr: 'Jeune pousse',  en: 'Seedling',    es: 'Brote'       },
  { id: 'writer',      threshold: 200,  icon: '✍️',  fr: 'Écrivain',      en: 'Writer',      es: 'Escritor/a'  },
  { id: 'voice',       threshold: 500,  icon: '🎙️', fr: 'Ta voix',       en: 'Your Voice',  es: 'Tu voz'      },
  { id: 'storyteller', threshold: 1000, icon: '📖', fr: 'Conteur',       en: 'Storyteller', es: 'Narrador/a'  },
  { id: 'gardener',    threshold: 2500, icon: '🌿', fr: 'Jardinier',     en: 'Gardener',    es: 'Jardinero/a' },
  { id: 'sage',        threshold: 5000, icon: '🌳', fr: 'Sage',          en: 'Sage',        es: 'Sabio/a'     },
];

export const EMOTION_SUGGESTIONS: EmotionSuggestion[] = [
  {
    category: "Calm",
    categoryFr: "Calme",
    categoryEs: "Calmado",
    emotions: [
      { en: "peaceful", fr: "paisible", es: "tranquilo/a", nuance: "A deep stillness, free from disturbance", collocations: ["une paix intérieure", "un calme paisible"] },
      { en: "content", fr: "satisfait(e)", es: "contento/a", nuance: "Quietly satisfied with how things are", collocations: ["se sentir satisfait(e)", "un contentement tranquille"] },
      { en: "relaxed", fr: "détendu(e)", es: "relajado/a", nuance: "Tension has left your body and mind", collocations: ["une atmosphère détendue", "se sentir détendu(e)"] },
      { en: "settled", fr: "apaisé(e)", es: "calmado/a", nuance: "Things feel resolved or in place", collocations: ["un esprit apaisé", "se sentir apaisé(e)"] },
      { en: "serene", fr: "serein(e)", es: "sereno/a", nuance: "Calm and untroubled, like still water", collocations: ["une sérénité profonde", "rester serein(e)"] },
      { en: "grounded", fr: "ancré(e)", es: "arraigado/a", nuance: "Connected to the present, stable", collocations: ["rester ancré(e)", "un sentiment d'ancrage"] },
    ],
  },
  {
    category: "Uncertain",
    categoryFr: "Incertain",
    categoryEs: "Inseguro",
    emotions: [
      { en: "unsure", fr: "incertain(e)", es: "inseguro/a", nuance: "Lacking confidence about what to do or think", collocations: ["un avenir incertain", "rester dans l'incertitude"] },
      { en: "hesitant", fr: "hésitant(e)", es: "vacilante", nuance: "Pausing before acting, not quite ready", collocations: ["d'un pas hésitant", "une voix hésitante"] },
      { en: "questioning", fr: "interrogatif/ive", es: "cuestionando", nuance: "Actively wondering, seeking clarity", collocations: ["un regard interrogateur", "se poser des questions"] },
      { en: "searching", fr: "en quête", es: "buscando", nuance: "Looking for something you haven't found yet", collocations: ["en quête de sens", "être en quête de soi"] },
      { en: "ambivalent", fr: "ambivalent(e)", es: "ambivalente", nuance: "Pulled in two directions at once", collocations: ["un sentiment ambivalent", "rester ambivalent(e)"] },
      { en: "torn", fr: "tiraillé(e)", es: "dividido/a", nuance: "Conflicted between competing feelings or choices", collocations: ["tiraillé(e) entre deux choix", "se sentir tiraillé(e)"] },
    ],
  },
  {
    category: "Heavy",
    categoryFr: "Lourd",
    categoryEs: "Pesado",
    emotions: [
      { en: "tired", fr: "fatigué(e)", es: "cansado/a", nuance: "Needing rest, energy is low", collocations: ["une fatigue profonde", "mort(e) de fatigue"] },
      { en: "weary", fr: "las/lasse", es: "agotado/a", nuance: "Tired from sustained effort or worry", collocations: ["las/lasse de tout", "un regard las"] },
      { en: "drained", fr: "épuisé(e)", es: "sin energía", nuance: "Emptied out, nothing left to give", collocations: ["complètement épuisé(e)", "à bout de forces"] },
      { en: "low", fr: "abattu(e)", es: "decaído/a", nuance: "Spirits are down, subdued mood", collocations: ["se sentir abattu(e)", "un air abattu"] },
      { en: "overwhelmed", fr: "submergé(e)", es: "abrumado/a", nuance: "Too much is happening to process", collocations: ["submergé(e) de travail", "se sentir submergé(e)"] },
      { en: "burdened", fr: "accablé(e)", es: "agobiado/a", nuance: "Carrying a weight that feels too heavy", collocations: ["accablé(e) de soucis", "un poids accablant"] },
    ],
  },
  {
    category: "Light",
    categoryFr: "Léger",
    categoryEs: "Ligero",
    emotions: [
      { en: "hopeful", fr: "plein(e) d'espoir", es: "esperanzado/a", nuance: "Sensing that something good is possible", collocations: ["garder l'espoir", "un regard plein d'espoir"] },
      { en: "curious", fr: "curieux/se", es: "curioso/a", nuance: "Drawn to learn or explore something", collocations: ["une curiosité insatiable", "piquer la curiosité"] },
      { en: "grateful", fr: "reconnaissant(e)", es: "agradecido/a", nuance: "Appreciating what you have or received", collocations: ["être reconnaissant(e) envers", "un cœur reconnaissant"] },
      { en: "present", fr: "présent(e)", es: "presente", nuance: "Fully here, not lost in past or future", collocations: ["être présent(e) à l'instant", "vivre le moment présent"] },
      { en: "energized", fr: "dynamisé(e)", es: "energizado/a", nuance: "Feeling a surge of vitality or motivation", collocations: ["se sentir dynamisé(e)", "une énergie débordante"] },
      { en: "inspired", fr: "inspiré(e)", es: "inspirado/a", nuance: "Moved to create or act by something meaningful", collocations: ["une inspiration soudaine", "se sentir inspiré(e)"] },
    ],
  },
  {
    category: "Tender",
    categoryFr: "Tendre",
    categoryEs: "Tierno",
    emotions: [
      { en: "vulnerable", fr: "vulnérable", es: "vulnerable", nuance: "Open and exposed, emotionally unguarded", collocations: ["se sentir vulnérable", "un moment de vulnérabilité"] },
      { en: "moved", fr: "ému(e)", es: "conmovido/a", nuance: "Touched deeply by something you witnessed or felt", collocations: ["ému(e) aux larmes", "profondément ému(e)"] },
      { en: "nostalgic", fr: "nostalgique", es: "nostálgico/a", nuance: "A bittersweet longing for something past", collocations: ["une nostalgie douce", "un souvenir nostalgique"] },
      { en: "tender", fr: "attendri(e)", es: "enternecido/a", nuance: "Softened by affection or compassion", collocations: ["un regard attendri", "un geste de tendresse"] },
      { en: "compassionate", fr: "compatissant(e)", es: "compasivo/a", nuance: "Feeling for another's pain or struggle", collocations: ["faire preuve de compassion", "un cœur compatissant"] },
      { en: "wistful", fr: "mélancolique", es: "melancólico/a", nuance: "Gently sad, wishing for something distant", collocations: ["une mélancolie douce", "un air mélancolique"] },
    ],
  },
  {
    category: "Frustrated",
    categoryFr: "Frustré",
    categoryEs: "Frustrado",
    emotions: [
      { en: "irritated", fr: "irrité(e)", es: "irritado/a", nuance: "Mildly angered by something small but persistent", collocations: ["une irritation croissante", "être irrité(e) par"] },
      { en: "impatient", fr: "impatient(e)", es: "impaciente", nuance: "Wanting something to happen faster", collocations: ["brûler d'impatience", "un geste impatient"] },
      { en: "stuck", fr: "bloqué(e)", es: "atascado/a", nuance: "Unable to move forward despite effort", collocations: ["se sentir bloqué(e)", "rester bloqué(e)"] },
      { en: "restless", fr: "agité(e)", es: "inquieto/a", nuance: "Can't settle, needing change or movement", collocations: ["une nuit agitée", "un esprit agité"] },
      { en: "exasperated", fr: "exaspéré(e)", es: "exasperado/a", nuance: "Frustrated to the point of giving up", collocations: ["pousser un soupir d'exaspération", "être exaspéré(e) par"] },
      { en: "defeated", fr: "vaincu(e)", es: "derrotado/a", nuance: "Feeling like your efforts haven't been enough", collocations: ["un air vaincu", "s'avouer vaincu(e)"] },
    ],
  },
  {
    category: "Anxious",
    categoryFr: "Anxieux",
    categoryEs: "Ansioso",
    emotions: [
      { en: "nervous", fr: "nerveux/se", es: "nervioso/a", nuance: "On edge about something upcoming", collocations: ["une nervosité palpable", "un rire nerveux"] },
      { en: "apprehensive", fr: "appréhensif/ive", es: "aprensivo/a", nuance: "Anticipating something with unease", collocations: ["un regard appréhensif", "appréhender l'avenir"] },
      { en: "on-edge", fr: "sur les nerfs", es: "al límite", nuance: "Hyper-alert, easily startled", collocations: ["être à bout de nerfs", "avoir les nerfs à vif"] },
      { en: "scattered", fr: "dispersé(e)", es: "disperso/a", nuance: "Thoughts racing in many directions", collocations: ["un esprit dispersé", "se sentir dispersé(e)"] },
      { en: "uneasy", fr: "mal à l'aise", es: "incómodo/a", nuance: "Something feels off but hard to name", collocations: ["un malaise profond", "mettre mal à l'aise"] },
      { en: "panicked", fr: "paniqué(e)", es: "en pánico", nuance: "Overwhelmed by sudden fear or urgency", collocations: ["une crise de panique", "pris(e) de panique"] },
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
