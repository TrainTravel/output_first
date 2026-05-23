export type NeffStep = 0 | 1 | 2;
// 0 = Mindfulness, 1 = Common Humanity, 2 = Self-Kindness

export interface StepPhraseSet {
  label: { fr: string; en: string; es: string };
  phrases: { fr: string[]; en: string[]; es: string[] };
}

export const COMPASSION_PHRASES: [StepPhraseSet, StepPhraseSet, StepPhraseSet] = [
  {
    label: {
      fr: 'Présence consciente',
      en: 'Mindfulness',
      es: 'Presencia consciente',
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
    },
  },
  {
    label: {
      fr: 'Humanité partagée',
      en: 'Common humanity',
      es: 'Humanidad compartida',
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
    },
  },
  {
    label: {
      fr: 'Bienveillance envers soi',
      en: 'Self-kindness',
      es: 'Bondad hacia uno mismo',
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
    },
  },
];
