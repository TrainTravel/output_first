export type NeffStep = 0 | 1 | 2;
// 0 = Mindfulness, 1 = Common Humanity, 2 = Self-Kindness

/**
 * The set of languages we ship self-compassion phrases in. Mirrors
 * `Language` from LanguageContext but kept narrow here so this data file
 * stays decoupled from the context module.
 */
export type CompassionLang = 'fr' | 'en' | 'es' | 'ja' | 'zh-Hans' | 'zh-Hant';

type PerLang<T> = { [K in CompassionLang]: T };

export interface StepPhraseSet {
  label: PerLang<string>;
  phrases: PerLang<string[]>;
}

/**
 * CJK translations (ja / zh-Hans / zh-Hant) below are AI-drafted and queued
 * for native-speaker review per CLAUDE.md's translation policy. Treat as
 * functional drafts, not final. File fix PRs (not retro-edits) when a
 * reviewer flags issues.
 */
export const COMPASSION_PHRASES: [StepPhraseSet, StepPhraseSet, StepPhraseSet] = [
  {
    label: {
      fr: 'Présence consciente',
      en: 'Mindfulness',
      es: 'Presencia consciente',
      ja: '今この瞬間に気づく',
      'zh-Hans': '正念',
      'zh-Hant': '正念',
    },
    phrases: {
      en: [
        'This is a hard moment. I notice it without judgment.',
        'Something heavy is here right now.',
        'I notice this pain. It is real.',
        'This is a difficult moment. I let it be.',
        'I place a hand on my heart and observe what is here.',
        'There is suffering here. I see it.',
        'This feeling is present. I can hold it gently.',
        'I notice I am struggling. That is true.',
      ],
      fr: [
        'Ce moment est difficile. Je le remarque sans me juger.',
        'Quelque chose de lourd est là, en ce moment.',
        'Je reconnais cette douleur. Elle est réelle.',
        'Ce moment est difficile. Je le laisse être.',
        'Je pose une main sur mon cœur et observe ce qui est là.',
        'Il y a de la souffrance ici. Je la vois.',
        'Ce sentiment est présent. Je peux le tenir doucement.',
        "Je remarque que je lutte. C'est vrai.",
      ],
      es: [
        'Este momento es difícil. Lo noto sin juzgarme.',
        'Algo pesado está aquí ahora mismo.',
        'Noto este dolor. Es real.',
        'Este es un momento difícil. Lo dejo estar.',
        'Pongo una mano en mi corazón y observo lo que hay aquí.',
        'Hay sufrimiento aquí. Lo veo.',
        'Este sentimiento está presente. Puedo sostenerlo suavemente.',
        'Noto que estoy luchando. Eso es verdad.',
      ],
      ja: [
        '今は辛い時間です。判断せずに気づいています。',
        '今、何か重いものがここにあります。',
        'この痛みに気づいています。本物の痛みです。',
        'これは難しい瞬間です。そのままにしておきます。',
        '胸に手を当てて、今ここにあるものを観察します。',
        'ここに苦しみがあります。それを見ています。',
        'この気持ちが今あります。優しく受け止められます。',
        '自分が苦しんでいることに気づきます。それは本当のことです。',
      ],
      'zh-Hans': [
        '这是个艰难的时刻。我不带评判地觉察它。',
        '此刻有些沉重的东西在这里。',
        '我察觉到这份疼痛。它是真实的。',
        '这是个困难的时刻。我让它存在。',
        '我把手放在心口，观察这里的一切。',
        '这里有苦痛。我看见了它。',
        '这种感觉就在这里。我能温柔地承载它。',
        '我察觉到自己在挣扎。这是真的。',
      ],
      'zh-Hant': [
        '這是個艱難的時刻。我不帶評判地覺察它。',
        '此刻有些沉重的東西在這裡。',
        '我察覺到這份疼痛。它是真實的。',
        '這是個困難的時刻。我讓它存在。',
        '我把手放在心口，觀察這裡的一切。',
        '這裡有苦痛。我看見了它。',
        '這種感覺就在這裡。我能溫柔地承載它。',
        '我察覺到自己在掙扎。這是真的。',
      ],
    },
  },
  {
    label: {
      fr: 'Humanité partagée',
      en: 'Common humanity',
      es: 'Humanidad compartida',
      ja: '共通の人間性',
      'zh-Hans': '共通的人性',
      'zh-Hant': '共通的人性',
    },
    phrases: {
      en: [
        'Others have felt exactly this. I am not alone.',
        'This kind of pain is part of being human.',
        'Suffering is something we all share. I am not alone in this.',
        'Many people feel this way. I am in good company.',
        'What I feel, others have felt too. We are connected.',
        'This moment is part of the shared human experience.',
        'Struggling is not a sign of weakness. Everyone struggles.',
        'I am not alone in feeling this way.',
      ],
      fr: [
        "D'autres ont ressenti exactement cela. Je ne suis pas seul(e).",
        "Ce type de douleur fait partie de l'expérience humaine.",
        'La souffrance est quelque chose que nous partageons tous. Je ne suis pas seul(e).',
        'Beaucoup de gens se sentent ainsi. Je suis en bonne compagnie.',
        "Ce que je ressens, d'autres l'ont ressenti aussi. Nous sommes liés.",
        "Ce moment fait partie de l'expérience humaine commune.",
        'Lutter n\'est pas un signe de faiblesse. Tout le monde lutte.',
        'Je ne suis pas seul(e) à me sentir ainsi.',
      ],
      es: [
        'Otros han sentido exactamente esto. No estoy solo/a.',
        'Este tipo de dolor forma parte de la experiencia humana.',
        'El sufrimiento es algo que todos compartimos. No estoy solo/a en esto.',
        'Mucha gente se siente así. Estoy en buena compañía.',
        'Lo que siento, otros también lo han sentido. Estamos conectados.',
        'Este momento forma parte de la experiencia humana compartida.',
        'Luchar no es una señal de debilidad. Todo el mundo lucha.',
        'No estoy solo/a sintiéndome así.',
      ],
      ja: [
        '他の人もまさにこれを感じてきました。一人ではありません。',
        'この種の痛みは人間であることの一部です。',
        '苦しみは誰もが共有するものです。一人で耐えているわけではありません。',
        '多くの人がこう感じています。良い仲間がいます。',
        '自分が感じていることを、他の人も感じてきました。私たちはつながっています。',
        'この瞬間は、人類が共有する経験の一部です。',
        '苦しむことは弱さの印ではありません。誰もが苦しみます。',
        'こう感じているのは一人ではありません。',
      ],
      'zh-Hans': [
        '别人也曾经历过这种感受。我并不孤单。',
        '这种痛苦是为人的一部分。',
        '苦痛是我们共同的经历。我并不是独自承受。',
        '很多人都有这样的感受。我并不孤单。',
        '我所感受的，别人也感受过。我们是相连的。',
        '这一刻属于人类共同的经验。',
        '挣扎不是软弱的标志。每个人都会挣扎。',
        '这样感觉的不止我一个人。',
      ],
      'zh-Hant': [
        '別人也曾經歷過這種感受。我並不孤單。',
        '這種痛苦是為人的一部分。',
        '苦痛是我們共同的經歷。我並不是獨自承受。',
        '很多人都有這樣的感受。我並不孤單。',
        '我所感受的，別人也感受過。我們是相連的。',
        '這一刻屬於人類共同的經驗。',
        '掙扎不是軟弱的標誌。每個人都會掙扎。',
        '這樣感覺的不止我一個人。',
      ],
    },
  },
  {
    label: {
      fr: 'Bienveillance envers soi',
      en: 'Self-kindness',
      es: 'Bondad hacia uno mismo',
      ja: '自分にやさしく',
      'zh-Hans': '善待自己',
      'zh-Hant': '善待自己',
    },
    phrases: {
      en: [
        'May I be gentle with myself right now.',
        'I deserve the same kindness I would offer a friend.',
        'I am doing the best I can.',
        'It is okay to rest. It is okay to be imperfect.',
        'I am worthy of care, especially in hard moments.',
        'I give myself permission to be human.',
        'I treat myself with warmth, just as I would a dear friend.',
        'I am here for myself. That is enough.',
      ],
      fr: [
        'Que je puisse être doux/douce avec moi-même en ce moment.',
        "Je mérite la même bienveillance que j'offrirais à un ami.",
        'Je fais de mon mieux.',
        "Il est permis de se reposer. Il est permis d'être imparfait(e).",
        'Je mérite d\'être pris(e) en soin, surtout dans les moments difficiles.',
        "Je me donne la permission d'être humain(e).",
        'Je me traite avec chaleur, comme je le ferais pour un ami cher.',
        'Je suis là pour moi-même. C\'est suffisant.',
      ],
      es: [
        'Que pueda ser amable conmigo mismo/a ahora mismo.',
        'Merezco la misma bondad que ofrecería a un amigo.',
        'Estoy haciendo lo mejor que puedo.',
        'Está bien descansar. Está bien ser imperfecto/a.',
        'Merezco cuidado, especialmente en los momentos difíciles.',
        'Me doy permiso de ser humano/a.',
        'Me trato con calidez, como lo haría con un querido amigo.',
        'Estoy aquí para mí mismo/a. Es suficiente.',
      ],
      ja: [
        '今、自分に優しくありますように。',
        '友達にしてあげるのと同じ優しさを、自分にも向けてよいのです。',
        '自分にできる精一杯のことをしています。',
        '休んでよいのです。完璧でなくてよいのです。',
        '辛い時こそ、思いやりに値する存在です。',
        '人間であることを自分に許します。',
        '親しい友人に接するように、温かさを持って自分に接します。',
        '自分のためにここにいます。それで十分です。',
      ],
      'zh-Hans': [
        '愿我此刻能温柔地对待自己。',
        '我值得获得我会给予朋友的那份善意。',
        '我已经在尽力而为。',
        '休息也无妨。不完美也无妨。',
        '我值得被关怀，尤其在艰难时刻。',
        '我允许自己作为人而存在。',
        '我以温暖待自己，就像对待挚友。',
        '我陪伴着自己。这就够了。',
      ],
      'zh-Hant': [
        '願我此刻能溫柔地對待自己。',
        '我值得獲得我會給予朋友的那份善意。',
        '我已經在盡力而為。',
        '休息也無妨。不完美也無妨。',
        '我值得被關懷，尤其在艱難時刻。',
        '我允許自己作為人而存在。',
        '我以溫暖待自己，就像對待摯友。',
        '我陪伴著自己。這就夠了。',
      ],
    },
  },
];
