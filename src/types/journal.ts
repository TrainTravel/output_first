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

export type JournalStep = 'home' | 'centerchoice' | 'breathe' | 'bodyscan' | 'promptchoice' | 'promptlibrary'
  | 'write' | 'feedback' | 'emotions' | 'reflection' | 'selfcompassion' | 'gratitude' | 'complete'
  | 'chat' | 'braindump' | 'thoughtgarden' | 'clusters' | 'clusterdetail'
  | 'zengarden' | 'freewrite' | 'freewritechoice' | 'expressivewrite'
  | 'vocabulary' | 'smallwins' | 'sandtimer' | 'focusplan' | 'todolist' | 'tinyexperiment'
  | 'quadrants'
  | 'languagesettings';

export type Quadrant = 'q1' | 'q2' | 'q3' | 'q4';
export const QUADRANTS: Quadrant[] = ['q1', 'q2', 'q3', 'q4'];

export const MIN_CYCLES = 1;
export const MAX_CYCLES = 5;

export interface BilingualPrompt {
  en: string;
  fr: string;
  zhHans?: string;
  zhHant?: string;
}

export type FillInCategory = 'Emotions' | 'Daily Life' | 'Observations' | 'Challenges' | 'Hopes' | 'Situations';

export interface VocabPair {
  fr: string;
  en: string;
  /** Simplified Chinese */
  zhHans?: string;
  /** Traditional Chinese */
  zhHant?: string;
  /** Pinyin romanization */
  pinyin?: string;
}

export interface FillInPrompt {
  id: string;
  category: FillInCategory;
  fr: string;
  en: string;
  es: string;
  zhHans?: string;
  zhHant?: string;
  vocabulary?: VocabPair[];
}

export interface Badge {
  id: string;
  threshold: number;
  icon: string;
  fr: string;
  en: string;
  es: string;
  ja?: string;
  'zh-Hans'?: string;
  'zh-Hant'?: string;
}

export interface EmotionWord {
  en: string;
  fr: string;
  es: string;
  nuance: string;
  collocations?: string[];
  /** Simplified Chinese */
  zhHans?: string;
  /** Traditional Chinese */
  zhHant?: string;
  /** Pinyin romanization */
  pinyin?: string;
  /** Chinese collocations/expressions */
  zhCollocations?: string[];
}

export interface EmotionSuggestion {
  category: string;
  categoryFr: string;
  categoryEs: string;
  categoryZhHans?: string;
  categoryZhHant?: string;
  emotions: EmotionWord[];
}

export const DAILY_PROMPTS: BilingualPrompt[] = [
  { en: "How are you feeling right now?", fr: "Comment vous sentez-vous en ce moment ?", zhHans: "你现在感觉怎么样？", zhHant: "你現在感覺怎麼樣？" },
  { en: "What's on your mind today?", fr: "Qu'avez-vous en tête aujourd'hui ?", zhHans: "你今天在想什么？", zhHant: "你今天在想什麼？" },
  { en: "Describe a moment from today.", fr: "Décrivez un moment de votre journée.", zhHans: "描述今天的一个瞬间。", zhHant: "描述今天的一個瞬間。" },
  { en: "What's something you noticed recently?", fr: "Qu'avez-vous remarqué récemment ?", zhHans: "你最近注意到了什么？", zhHant: "你最近注意到了什麼？" },
  { en: "How did today begin for you?", fr: "Comment votre journée a-t-elle commencé ?", zhHans: "你今天是怎么开始的？", zhHant: "你今天是怎麼開始的？" },
  { en: "What's taking up space in your thoughts?", fr: "Qu'est-ce qui occupe vos pensées ?", zhHans: "什么占据了你的思绪？", zhHant: "什麼佔據了你的思緒？" },
];

export const GRATITUDE_PROMPTS: BilingualPrompt[] = [
  { en: "What's one small thing you appreciated today?", fr: "Quelle petite chose avez-vous appréciée aujourd'hui ?", zhHans: "今天你感激的一件小事是什么？", zhHant: "今天你感激的一件小事是什麼？" },
  { en: "What moment brought you a bit of peace?", fr: "Quel moment vous a apporté un peu de paix ?", zhHans: "哪个瞬间给了你一点平静？", zhHant: "哪個瞬間給了你一點平靜？" },
  { en: "Who or what made today a little easier?", fr: "Qui ou quoi a rendu votre journée un peu plus facile ?", zhHans: "谁或什么让今天变得轻松一些？", zhHant: "誰或什麼讓今天變得輕鬆一些？" },
  { en: "What simple comfort did you enjoy?", fr: "Quel petit plaisir avez-vous apprécié ?", zhHans: "你享受了什么简单的舒适？", zhHant: "你享受了什麼簡單的舒適？" },
];

export const FILL_IN_PROMPTS: FillInPrompt[] = [
  // Emotions
  { id: 'em1', category: 'Emotions', fr: "Aujourd'hui je me sens ___ parce que ___.", en: "Today I feel ___ because ___.", es: "Hoy me siento ___ porque ___.",
    zhHans: "今天我感到___，因为___。", zhHant: "今天我感到___，因為___。" },
  { id: 'em2', category: 'Emotions', fr: "En ce moment, je remarque ___ dans mon corps.", en: "Right now, I notice ___ in my body.", es: "Ahora mismo, noto ___ en mi cuerpo.",
    zhHans: "此刻，我注意到身体里___。", zhHant: "此刻，我注意到身體裡___。" },
  { id: 'em3', category: 'Emotions', fr: "Ce qui m'a touché(e) aujourd'hui, c'est ___.", en: "What touched me today was ___.", es: "Lo que me llegó hoy fue ___.",
    zhHans: "今天触动我的是___。", zhHant: "今天觸動我的是___。" },
  // Daily Life
  { id: 'dl1', category: 'Daily Life', fr: "Aujourd'hui j'ai ___ et ça m'a fait ___.", en: "Today I ___ and it made me feel ___.", es: "Hoy yo ___ y eso me hizo sentir ___.",
    zhHans: "今天我___，这让我感到___。", zhHant: "今天我___，這讓我感到___。" },
  { id: 'dl2', category: 'Daily Life', fr: "Un moment que je veux retenir aujourd'hui : ___.", en: "A moment I want to remember from today: ___.", es: "Un momento que quiero recordar de hoy: ___.",
    zhHans: "今天我想记住的一个瞬间：___。", zhHant: "今天我想記住的一個瞬間：___。" },
  { id: 'dl3', category: 'Daily Life', fr: "Ce matin je ___, et cet après-midi je ___.", en: "This morning I ___, and this afternoon I ___.", es: "Esta mañana yo ___, y esta tarde yo ___.",
    zhHans: "今天早上我___，下午我___。", zhHant: "今天早上我___，下午我___。" },
  // Observations
  { id: 'ob1', category: 'Observations', fr: "J'ai remarqué que ___. Ça m'a fait penser à ___.", en: "I noticed that ___. It made me think about ___.", es: "Noté que ___. Me hizo pensar en ___.",
    zhHans: "我注意到___。这让我想到___。", zhHant: "我注意到___。這讓我想到___。" },
  { id: 'ob2', category: 'Observations', fr: "Quelque chose de petit m'a surpris(e) : ___.", en: "Something small surprised me: ___.", es: "Algo pequeño me sorprendió: ___.",
    zhHans: "一件小事让我惊讶：___。", zhHant: "一件小事讓我驚訝：___。" },
  { id: 'ob3', category: 'Observations', fr: "Les gens autour de moi ___, et moi je ___.", en: "The people around me ___, and I ___.", es: "La gente a mi alrededor ___, y yo ___.",
    zhHans: "我周围的人___，而我___。", zhHant: "我周圍的人___，而我___。" },
  // Challenges
  { id: 'ch1', category: 'Challenges', fr: "J'ai du mal à ___, mais je sais que ___.", en: "I struggle with ___, but I know that ___.", es: "Me cuesta ___, pero sé que ___.",
    zhHans: "我在___方面有困难，但我知道___。", zhHant: "我在___方面有困難，但我知道___。" },
  { id: 'ch2', category: 'Challenges', fr: "Ce qui me pèse en ce moment c'est ___. Ce qui m'aide c'est ___.", en: "What's weighing on me is ___. What helps is ___.", es: "Lo que me pesa es ___. Lo que me ayuda es ___.",
    zhHans: "现在压在我心上的是___。帮助我的是___。", zhHant: "最近放不下的：___\n讓我安心的：___" },
  { id: 'ch3', category: 'Challenges', fr: "Si je pouvais changer une chose aujourd'hui, ce serait ___.", en: "If I could change one thing today, it would be ___.", es: "Si pudiera cambiar una cosa hoy, sería ___.",
    zhHans: "如果我今天能改变一件事，那就是___。", zhHant: "如果我今天能改變一件事，那就是___。" },
  // Hopes
  { id: 'hp1', category: 'Hopes', fr: "Je suis reconnaissant(e) pour ___ parce que ___.", en: "I'm grateful for ___ because ___.", es: "Estoy agradecido/a por ___ porque ___.",
    zhHans: "我感激___，因为___。", zhHant: "我感激___，因為___。" },
  { id: 'hp2', category: 'Hopes', fr: "Cette semaine, j'espère ___. Pour ça je vais ___.", en: "This week, I hope to ___. To do that I will ___.", es: "Esta semana, espero ___. Para eso voy a ___.",
    zhHans: "这周我希望___。为此我会___。", zhHant: "這週我希望___。為此我會___。" },
  { id: 'hp3', category: 'Hopes', fr: "Un mot qui décrit où je veux être : ___. Parce que ___.", en: "One word for where I want to be: ___. Because ___.", es: "Una palabra para donde quiero estar: ___. Porque ___.",
    zhHans: "一个词描述我想去的地方：___。因为___。", zhHant: "一個詞描述我想去的地方：___。因為___。" },
  // Situations
  { id: 'si1', category: 'Situations', fr: "Décrivez un moment où vous vous êtes senti(e) fier/fière.", en: "Describe a moment you felt proud.", es: "Describe un momento en que te sentiste orgulloso/a.",
    zhHans: "描述一个让你感到骄傲的时刻。", zhHant: "描述一個讓你感到驕傲的時刻。",
    vocabulary: [
      { fr: 'fier/fière', en: 'proud', zhHans: '骄傲', zhHant: '驕傲', pinyin: 'jiāo\'ào' },
      { fr: 'accomplissement', en: 'achievement', zhHans: '成就', zhHant: '成就', pinyin: 'chéngjìu' },
      { fr: 'réussir', en: 'to succeed', zhHans: '成功', zhHant: '成功', pinyin: 'chénggōng' },
    ] },
  { id: 'si2', category: 'Situations', fr: "Racontez un malentendu récent.", en: "Tell about a recent misunderstanding.", es: "Cuenta un malentendido reciente.",
    zhHans: "讲述最近的一个误会。", zhHant: "講述最近的一個誤會。",
    vocabulary: [
      { fr: 'malentendu', en: 'misunderstanding', zhHans: '误会', zhHant: '誤會', pinyin: 'wùhuì' },
      { fr: 'expliquer', en: 'to explain', zhHans: '解释', zhHant: '解釋', pinyin: 'jiěshì' },
      { fr: 'confus(e)', en: 'confused', zhHans: '困惑', zhHant: '困惑', pinyin: 'kùnhuò' },
    ] },
  { id: 'si3', category: 'Situations', fr: "Décrivez un endroit où vous vous sentez en sécurité.", en: "Describe a place where you feel safe.", es: "Describe un lugar donde te sientes seguro/a.",
    zhHans: "描述一个让你感到安全的地方。", zhHant: "描述一個讓你感到安全的地方。",
    vocabulary: [
      { fr: 'en sécurité', en: 'safe', zhHans: '安全', zhHant: '安全', pinyin: 'ānquán' },
      { fr: 'chaleureux/se', en: 'warm', zhHans: '温暖', zhHant: '溫暖', pinyin: 'wēnnuǎn' },
      { fr: 'refuge', en: 'shelter', zhHans: '避风港', zhHant: '避風港', pinyin: 'bìfēnggǎng' },
      { fr: 'paisible', en: 'peaceful', zhHans: '宁静', zhHant: '寧靜', pinyin: 'níngjìng' },
    ] },
  { id: 'si4', category: 'Situations', fr: "Parlez d'une fois où vous avez aidé quelqu'un.", en: "Talk about a time you helped someone.", es: "Habla de una vez que ayudaste a alguien.",
    zhHans: "谈谈你帮助过别人的一次经历。", zhHant: "談談你幫助過別人的一次經歷。",
    vocabulary: [
      { fr: 'aider', en: 'to help', zhHans: '帮助', zhHant: '幫助', pinyin: 'bāngzhù' },
      { fr: 'reconnaissant(e)', en: 'grateful', zhHans: '感激', zhHant: '感激', pinyin: 'gǎnjī' },
      { fr: 'soutenir', en: 'to support', zhHans: '支持', zhHant: '支持', pinyin: 'zhīchí' },
    ] },
  { id: 'si5', category: 'Situations', fr: "Racontez un moment où vous avez dû être courageux/se.", en: "Tell about a moment you had to be brave.", es: "Cuenta un momento en que tuviste que ser valiente.",
    zhHans: "讲述一个你不得不勇敢的时刻。", zhHant: "講述一個你不得不勇敢的時刻。",
    vocabulary: [
      { fr: 'courageux/se', en: 'brave', zhHans: '勇敢', zhHant: '勇敢', pinyin: 'yǒnggǎn' },
      { fr: 'surmonter', en: 'to overcome', zhHans: '克服', zhHant: '克服', pinyin: 'kèfú' },
      { fr: 'peur', en: 'fear', zhHans: '害怕', zhHant: '害怕', pinyin: 'hàipà' },
      { fr: 'oser', en: 'to dare', zhHans: '敢', zhHant: '敢', pinyin: 'gǎn' },
    ] },
  { id: 'si6', category: 'Situations', fr: "Décrivez un repas qui vous a rendu(e) heureux/se.", en: "Describe a meal that made you happy.", es: "Describe una comida que te hizo feliz.",
    zhHans: "描述一顿让你开心的饭。", zhHant: "描述一頓讓你開心的飯。",
    vocabulary: [
      { fr: 'délicieux/se', en: 'delicious', zhHans: '好吃', zhHant: '好吃', pinyin: 'hǎochī' },
      { fr: 'savourer', en: 'to savor', zhHans: '品尝', zhHant: '品嚐', pinyin: 'pǐncháng' },
      { fr: 'partager', en: 'to share', zhHans: '分享', zhHant: '分享', pinyin: 'fēnxiǎng' },
    ] },
];

export const BADGES: Badge[] = [
  { id: 'seedling',    threshold: 50,   icon: '🌱', fr: 'Jeune pousse',  en: 'Seedling',    es: 'Brote',        ja: '新芽',          'zh-Hans': '嫩芽',           'zh-Hant': '嫩芽'           },
  { id: 'writer',      threshold: 200,  icon: '✍️',  fr: 'Écrivain',      en: 'Writer',      es: 'Escritor/a',   ja: '書き手',        'zh-Hans': '写作者',         'zh-Hant': '寫作者'         },
  { id: 'voice',       threshold: 500,  icon: '🎙️', fr: 'Ta voix',       en: 'Your Voice',  es: 'Tu voz',       ja: 'あなたの声',    'zh-Hans': '你的声音',       'zh-Hant': '你的聲音'       },
  { id: 'storyteller', threshold: 1000, icon: '📖', fr: 'Conteur',       en: 'Storyteller', es: 'Narrador/a',   ja: '語り手',        'zh-Hans': '讲故事的人',     'zh-Hant': '講故事的人'     },
  { id: 'gardener',    threshold: 2500, icon: '🌿', fr: 'Jardinier',     en: 'Gardener',    es: 'Jardinero/a',  ja: '庭師',          'zh-Hans': '园丁',           'zh-Hant': '園丁'           },
  { id: 'sage',        threshold: 5000, icon: '🌳', fr: 'Sage',          en: 'Sage',        es: 'Sabio/a',      ja: '賢者',          'zh-Hans': '智者',           'zh-Hant': '智者'           },
];

export const EMOTION_SUGGESTIONS: EmotionSuggestion[] = [
  {
    category: "Calm",
    categoryFr: "Calme",
    categoryEs: "Calmado",
    categoryZhHans: "平静",
    categoryZhHant: "平靜",
    emotions: [
      { en: "peaceful", fr: "paisible", es: "tranquilo/a", nuance: "A deep stillness, free from disturbance", collocations: ["une paix intérieure", "un calme paisible"], zhHans: "平静", zhHant: "平靜", pinyin: "píngjìng", zhCollocations: ["内心平静", "心如止水"] },
      { en: "content", fr: "satisfait(e)", es: "contento/a", nuance: "Quietly satisfied with how things are", collocations: ["se sentir satisfait(e)", "un contentement tranquille"], zhHans: "满足", zhHant: "滿足", pinyin: "mǎnzú", zhCollocations: ["心满意足", "知足常乐"] },
      { en: "relaxed", fr: "détendu(e)", es: "relajado/a", nuance: "Tension has left your body and mind", collocations: ["une atmosphère détendue", "se sentir détendu(e)"], zhHans: "放松", zhHant: "放鬆", pinyin: "fàngsōng", zhCollocations: ["身心放松", "轻松自在"] },
      { en: "settled", fr: "apaisé(e)", es: "calmado/a", nuance: "Things feel resolved or in place", collocations: ["un esprit apaisé", "se sentir apaisé(e)"], zhHans: "安定", zhHant: "安定", pinyin: "āndìng", zhCollocations: ["安定下来", "心安理得"] },
      { en: "serene", fr: "serein(e)", es: "sereno/a", nuance: "Calm and untroubled, like still water", collocations: ["une sérénité profonde", "rester serein(e)"], zhHans: "宁静", zhHant: "寧靜", pinyin: "níngjìng", zhCollocations: ["宁静致远", "岁月静好"] },
      { en: "grounded", fr: "ancré(e)", es: "arraigado/a", nuance: "Connected to the present, stable", collocations: ["rester ancré(e)", "un sentiment d'ancrage"], zhHans: "踏实", zhHant: "踏實", pinyin: "tāshi", zhCollocations: ["脚踏实地", "心里踏实"] },
    ],
  },
  {
    category: "Uncertain",
    categoryFr: "Incertain",
    categoryEs: "Inseguro",
    categoryZhHans: "不确定",
    categoryZhHant: "不確定",
    emotions: [
      { en: "unsure", fr: "incertain(e)", es: "inseguro/a", nuance: "Lacking confidence about what to do or think", collocations: ["un avenir incertain", "rester dans l'incertitude"], zhHans: "不确定", zhHant: "不確定", pinyin: "bù quèdìng", zhCollocations: ["心里没底", "举棋不定"] },
      { en: "hesitant", fr: "hésitant(e)", es: "vacilante", nuance: "Pausing before acting, not quite ready", collocations: ["d'un pas hésitant", "une voix hésitante"], zhHans: "犹豫", zhHant: "猶豫", pinyin: "yóuyù", zhCollocations: ["犹豫不决", "踌躇不前"] },
      { en: "questioning", fr: "interrogatif/ive", es: "cuestionando", nuance: "Actively wondering, seeking clarity", collocations: ["un regard interrogateur", "se poser des questions"], zhHans: "疑惑", zhHant: "疑惑", pinyin: "yíhuò", zhCollocations: ["满腹疑惑", "百思不解"] },
      { en: "searching", fr: "en quête", es: "buscando", nuance: "Looking for something you haven't found yet", collocations: ["en quête de sens", "être en quête de soi"], zhHans: "探索", zhHant: "探索", pinyin: "tànsuǒ", zhCollocations: ["不断探索", "上下求索"] },
      { en: "ambivalent", fr: "ambivalent(e)", es: "ambivalente", nuance: "Pulled in two directions at once", collocations: ["un sentiment ambivalent", "rester ambivalent(e)"], zhHans: "矛盾", zhHant: "矛盾", pinyin: "máodùn", zhCollocations: ["心情矛盾", "左右为难"] },
      { en: "torn", fr: "tiraillé(e)", es: "dividido/a", nuance: "Conflicted between competing feelings or choices", collocations: ["tiraillé(e) entre deux choix", "se sentir tiraillé(e)"], zhHans: "挣扎", zhHant: "掙扎", pinyin: "zhēngzhá", zhCollocations: ["内心挣扎", "痛苦挣扎"] },
    ],
  },
  {
    category: "Heavy",
    categoryFr: "Lourd",
    categoryEs: "Pesado",
    categoryZhHans: "沉重",
    categoryZhHant: "沉重",
    emotions: [
      { en: "tired", fr: "fatigué(e)", es: "cansado/a", nuance: "Needing rest, energy is low", collocations: ["une fatigue profonde", "mort(e) de fatigue"], zhHans: "疲倦", zhHant: "疲倦", pinyin: "píjuàn", zhCollocations: ["身心疲倦", "疲倦不堪"] },
      { en: "weary", fr: "las/lasse", es: "agotado/a", nuance: "Tired from sustained effort or worry", collocations: ["las/lasse de tout", "un regard las"], zhHans: "疲惫", zhHant: "疲憊", pinyin: "píbèi", zhCollocations: ["身心俱疲", "疲惫不堪"] },
      { en: "drained", fr: "épuisé(e)", es: "sin energía", nuance: "Emptied out, nothing left to give", collocations: ["complètement épuisé(e)", "à bout de forces"], zhHans: "精疲力尽", zhHant: "精疲力盡", pinyin: "jīng pí lì jìn", zhCollocations: ["心力交瘁", "筋疲力尽"] },
      { en: "low", fr: "abattu(e)", es: "decaído/a", nuance: "Spirits are down, subdued mood", collocations: ["se sentir abattu(e)", "un air abattu"], zhHans: "沮丧", zhHant: "沮喪", pinyin: "jǔsàng", zhCollocations: ["情绪低落", "垂头丧气"] },
      { en: "overwhelmed", fr: "submergé(e)", es: "abrumado/a", nuance: "Too much is happening to process", collocations: ["submergé(e) de travail", "se sentir submergé(e)"], zhHans: "不堪重负", zhHant: "不堪重負", pinyin: "bùkān zhòngfù", zhCollocations: ["压力山大", "喘不过气"] },
      { en: "burdened", fr: "accablé(e)", es: "agobiado/a", nuance: "Carrying a weight that feels too heavy", collocations: ["accablé(e) de soucis", "un poids accablant"], zhHans: "沉重", zhHant: "沉重", pinyin: "chénzhòng", zhCollocations: ["心事重重", "负担沉重"] },
    ],
  },
  {
    category: "Light",
    categoryFr: "Léger",
    categoryEs: "Ligero",
    categoryZhHans: "轻松",
    categoryZhHant: "輕鬆",
    emotions: [
      { en: "hopeful", fr: "plein(e) d'espoir", es: "esperanzado/a", nuance: "Sensing that something good is possible", collocations: ["garder l'espoir", "un regard plein d'espoir"], zhHans: "充满希望", zhHant: "充滿希望", pinyin: "chōngmǎn xīwàng", zhCollocations: ["满怀希望", "看到希望"] },
      { en: "curious", fr: "curieux/se", es: "curioso/a", nuance: "Drawn to learn or explore something", collocations: ["une curiosité insatiable", "piquer la curiosité"], zhHans: "好奇", zhHant: "好奇", pinyin: "hàoqí", zhCollocations: ["充满好奇", "好奇心强"] },
      { en: "grateful", fr: "reconnaissant(e)", es: "agradecido/a", nuance: "Appreciating what you have or received", collocations: ["être reconnaissant(e) envers", "un cœur reconnaissant"], zhHans: "感恩", zhHant: "感恩", pinyin: "gǎn'ēn", zhCollocations: ["心存感恩", "感恩戴德"] },
      { en: "present", fr: "présent(e)", es: "presente", nuance: "Fully here, not lost in past or future", collocations: ["être présent(e) à l'instant", "vivre le moment présent"], zhHans: "当下", zhHant: "當下", pinyin: "dāngxià", zhCollocations: ["活在当下", "珍惜当下"] },
      { en: "energized", fr: "dynamisé(e)", es: "energizado/a", nuance: "Feeling a surge of vitality or motivation", collocations: ["se sentir dynamisé(e)", "une énergie débordante"], zhHans: "充满活力", zhHant: "充滿活力", pinyin: "chōngmǎn huólì", zhCollocations: ["精力充沛", "活力四射"] },
      { en: "inspired", fr: "inspiré(e)", es: "inspirado/a", nuance: "Moved to create or act by something meaningful", collocations: ["une inspiration soudaine", "se sentir inspiré(e)"], zhHans: "受到启发", zhHant: "受到啟發", pinyin: "shòudào qǐfā", zhCollocations: ["灵感涌现", "深受启发"] },
    ],
  },
  {
    category: "Tender",
    categoryFr: "Tendre",
    categoryEs: "Tierno",
    categoryZhHans: "温柔",
    categoryZhHant: "溫柔",
    emotions: [
      { en: "vulnerable", fr: "vulnérable", es: "vulnerable", nuance: "Open and exposed, emotionally unguarded", collocations: ["se sentir vulnérable", "un moment de vulnérabilité"], zhHans: "脆弱", zhHant: "脆弱", pinyin: "cuìruò", zhCollocations: ["感到脆弱", "不堪一击"] },
      { en: "moved", fr: "ému(e)", es: "conmovido/a", nuance: "Touched deeply by something you witnessed or felt", collocations: ["ému(e) aux larmes", "profondément ému(e)"], zhHans: "感动", zhHant: "感動", pinyin: "gǎndòng", zhCollocations: ["深受感动", "感动落泪"] },
      { en: "nostalgic", fr: "nostalgique", es: "nostálgico/a", nuance: "A bittersweet longing for something past", collocations: ["une nostalgie douce", "un souvenir nostalgique"], zhHans: "怀旧", zhHant: "懷舊", pinyin: "huáijiù", zhCollocations: ["怀旧之情", "触景生情"] },
      { en: "tender", fr: "attendri(e)", es: "enternecido/a", nuance: "Softened by affection or compassion", collocations: ["un regard attendri", "un geste de tendresse"], zhHans: "温柔", zhHant: "溫柔", pinyin: "wēnróu", zhCollocations: ["温柔以待", "柔情似水"] },
      { en: "compassionate", fr: "compatissant(e)", es: "compasivo/a", nuance: "Feeling for another's pain or struggle", collocations: ["faire preuve de compassion", "un cœur compatissant"], zhHans: "同情", zhHant: "同情", pinyin: "tóngqíng", zhCollocations: ["深表同情", "感同身受"] },
      { en: "wistful", fr: "mélancolique", es: "melancólico/a", nuance: "Gently sad, wishing for something distant", collocations: ["une mélancolie douce", "un air mélancolique"], zhHans: "惆怅", zhHant: "惆悵", pinyin: "chóuchàng", zhCollocations: ["满怀惆怅", "若有所失"] },
    ],
  },
  {
    category: "Frustrated",
    categoryFr: "Frustré",
    categoryEs: "Frustrado",
    categoryZhHans: "挫败",
    categoryZhHant: "挫敗",
    emotions: [
      { en: "irritated", fr: "irrité(e)", es: "irritado/a", nuance: "Mildly angered by something small but persistent", collocations: ["une irritation croissante", "être irrité(e) par"], zhHans: "烦躁", zhHant: "煩躁", pinyin: "fánzào", zhCollocations: ["心烦意乱", "烦躁不安"] },
      { en: "impatient", fr: "impatient(e)", es: "impaciente", nuance: "Wanting something to happen faster", collocations: ["brûler d'impatience", "un geste impatient"], zhHans: "急躁", zhHant: "急躁", pinyin: "jízào", zhCollocations: ["急躁不安", "迫不及待"] },
      { en: "stuck", fr: "bloqué(e)", es: "atascado/a", nuance: "Unable to move forward despite effort", collocations: ["se sentir bloqué(e)", "rester bloqué(e)"], zhHans: "卡住", zhHant: "卡住", pinyin: "kǎzhù", zhCollocations: ["进退两难", "陷入僵局"] },
      { en: "restless", fr: "agité(e)", es: "inquieto/a", nuance: "Can't settle, needing change or movement", collocations: ["une nuit agitée", "un esprit agité"], zhHans: "焦躁", zhHant: "焦躁", pinyin: "jiāozào", zhCollocations: ["焦躁不安", "坐立不安"] },
      { en: "exasperated", fr: "exaspéré(e)", es: "exasperado/a", nuance: "Frustrated to the point of giving up", collocations: ["pousser un soupir d'exaspération", "être exaspéré(e) par"], zhHans: "气愤", zhHant: "氣憤", pinyin: "qìfèn", zhCollocations: ["气愤不已", "怒火中烧"] },
      { en: "defeated", fr: "vaincu(e)", es: "derrotado/a", nuance: "Feeling like your efforts haven't been enough", collocations: ["un air vaincu", "s'avouer vaincu(e)"], zhHans: "挫败", zhHant: "挫敗", pinyin: "cuòbài", zhCollocations: ["挫败感", "一败涂地"] },
    ],
  },
  {
    category: "Anxious",
    categoryFr: "Anxieux",
    categoryEs: "Ansioso",
    categoryZhHans: "焦虑",
    categoryZhHant: "焦慮",
    emotions: [
      { en: "nervous", fr: "nerveux/se", es: "nervioso/a", nuance: "On edge about something upcoming", collocations: ["une nervosité palpable", "un rire nerveux"], zhHans: "紧张", zhHant: "緊張", pinyin: "jǐnzhāng", zhCollocations: ["紧张不安", "神经紧绷"] },
      { en: "apprehensive", fr: "appréhensif/ive", es: "aprensivo/a", nuance: "Anticipating something with unease", collocations: ["un regard appréhensif", "appréhender l'avenir"], zhHans: "忐忑", zhHant: "忐忑", pinyin: "tǎntè", zhCollocations: ["忐忑不安", "七上八下"] },
      { en: "on-edge", fr: "sur les nerfs", es: "al límite", nuance: "Hyper-alert, easily startled", collocations: ["être à bout de nerfs", "avoir les nerfs à vif"], zhHans: "提心吊胆", zhHant: "提心吊膽", pinyin: "tíxīn diàodǎn", zhCollocations: ["胆战心惊", "惶恐不安"] },
      { en: "scattered", fr: "dispersé(e)", es: "disperso/a", nuance: "Thoughts racing in many directions", collocations: ["un esprit dispersé", "se sentir dispersé(e)"], zhHans: "心烦意乱", zhHant: "心煩意亂", pinyin: "xīnfán yìluàn", zhCollocations: ["思绪万千", "心神不宁"] },
      { en: "uneasy", fr: "mal à l'aise", es: "incómodo/a", nuance: "Something feels off but hard to name", collocations: ["un malaise profond", "mettre mal à l'aise"], zhHans: "不安", zhHant: "不安", pinyin: "bù'ān", zhCollocations: ["坐立不安", "惴惴不安"] },
      { en: "panicked", fr: "paniqué(e)", es: "en pánico", nuance: "Overwhelmed by sudden fear or urgency", collocations: ["une crise de panique", "pris(e) de panique"], zhHans: "恐慌", zhHant: "恐慌", pinyin: "kǒnghuāng", zhCollocations: ["惊慌失措", "恐慌万分"] },
    ],
  },
  {
    category: "Connected",
    categoryFr: "Connecté",
    categoryEs: "Conectado",
    categoryZhHans: "连接",
    categoryZhHant: "連接",
    emotions: [
      { en: "belonging", fr: "un sentiment d'appartenance", es: "pertenencia", nuance: "Feeling part of something larger", collocations: ["un sentiment d'appartenance", "se sentir chez soi"], zhHans: "归属感", zhHant: "歸屬感", pinyin: "guīshǔgǎn", zhCollocations: ["找到归属", "宾至如归"] },
      { en: "understood", fr: "compris(e)", es: "comprendido/a", nuance: "Someone truly sees what you mean", collocations: ["se sentir compris(e)", "être enfin compris(e)"], zhHans: "被理解", zhHant: "被理解", pinyin: "bèi lǐjiě", zhCollocations: ["感到被理解", "心有灵犀"] },
      { en: "supported", fr: "soutenu(e)", es: "apoyado/a", nuance: "Knowing help is there when you need it", collocations: ["se sentir soutenu(e)", "un soutien inconditionnel"], zhHans: "被支持", zhHant: "被支持", pinyin: "bèi zhīchí", zhCollocations: ["坚强后盾", "得到支持"] },
      { en: "warm", fr: "chaleureux/se", es: "cálido/a", nuance: "A gentle glow of human connection", collocations: ["un accueil chaleureux", "une chaleur humaine"], zhHans: "温暖", zhHant: "溫暖", pinyin: "wēnnuǎn", zhCollocations: ["温暖如春", "暖心暖意"] },
      { en: "included", fr: "inclus(e)", es: "incluido/a", nuance: "Welcomed into a group or conversation", collocations: ["se sentir inclus(e)", "un geste d'inclusion"], zhHans: "被接纳", zhHant: "被接納", pinyin: "bèi jiēnà", zhCollocations: ["融入其中", "被接纳包容"] },
      { en: "cherished", fr: "chéri(e)", es: "querido/a", nuance: "Valued deeply by someone", collocations: ["un souvenir chéri", "être chéri(e) de tous"], zhHans: "被珍惜", zhHant: "被珍惜", pinyin: "bèi zhēnxī", zhCollocations: ["倍感珍惜", "珍惜拥有"] },
    ],
  },
];
