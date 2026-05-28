import type { TargetLang } from '@/contexts/LanguageContext';

/**
 * A philosopher / writer quote shown as a once-per-day reward on the journal
 * 'complete' screen. Pool is keyed by `target` so users see quotes in the
 * language they're learning.
 *
 * v1 ships canonical English translations only. FR / ES / CJK glosses are
 * deferred so native-review can land them per CLAUDE.md's translation policy.
 */
export interface PhilosopherQuote {
  id: string;
  target: TargetLang;
  /** Original quote in the target language. */
  original: string;
  /** Attribution — surfaces under the quote. */
  source: { author: string; work?: string; year?: number };
  /**
   * Translation of the quote into the user's primary language. For v1 only
   * `en` is populated (canonical published translations). Other primary
   * languages fall back to `en` until native-reviewed glosses are added.
   */
  translation: { en: string; fr?: string; es?: string; 'zh-Hans'?: string; 'zh-Hant'?: string };
}

export const PHILOSOPHER_QUOTES: readonly PhilosopherQuote[] = [
  // ─── French ───────────────────────────────────────────────────────────────
  {
    id: 'fr-merleau-ponty-1',
    target: 'fr',
    original: "Le monde n'est pas ce que je pense, mais ce que je vis.",
    source: { author: 'Maurice Merleau-Ponty', work: 'Phénoménologie de la perception', year: 1945 },
    translation: { en: 'The world is not what I think, but what I live through.' },
  },
  {
    id: 'fr-camus-1',
    target: 'fr',
    original: "Au milieu de l'hiver, j'apprenais enfin qu'il y avait en moi un été invincible.",
    source: { author: 'Albert Camus', work: "L'Été", year: 1954 },
    translation: { en: 'In the depth of winter, I finally learned that there lay within me an invincible summer.' },
  },
  {
    id: 'fr-weil-1',
    target: 'fr',
    original: "L'attention est la forme la plus rare et la plus pure de la générosité.",
    source: { author: 'Simone Weil', work: 'Lettres', year: 1950 },
    translation: { en: 'Attention is the rarest and purest form of generosity.' },
  },

  // ─── Spanish ──────────────────────────────────────────────────────────────
  {
    id: 'es-ortega-1',
    target: 'es',
    original: 'Yo soy yo y mi circunstancia, y si no la salvo a ella no me salvo yo.',
    source: { author: 'José Ortega y Gasset', work: 'Meditaciones del Quijote', year: 1914 },
    translation: { en: 'I am I and my circumstance, and if I do not save it, I do not save myself.' },
  },
  {
    id: 'es-borges-1',
    target: 'es',
    original: 'Siempre imaginé que el Paraíso sería algún tipo de biblioteca.',
    source: { author: 'Jorge Luis Borges', work: 'Poema de los dones', year: 1960 },
    translation: { en: 'I have always imagined that Paradise will be a kind of library.' },
  },
  {
    id: 'es-machado-1',
    target: 'es',
    original: 'Caminante, no hay camino, se hace camino al andar.',
    source: { author: 'Antonio Machado', work: 'Cantares', year: 1912 },
    translation: { en: 'Wanderer, there is no path — the path is made by walking.' },
  },

  // ─── Japanese ─────────────────────────────────────────────────────────────
  {
    id: 'ja-dogen-1',
    target: 'ja',
    original: '仏道をならふといふは、自己をならふなり。',
    source: { author: '道元 (Dōgen)', work: '正法眼蔵 (Shōbōgenzō)', year: 1233 },
    translation: { en: 'To study the Buddha-way is to study the self.' },
  },
  {
    id: 'ja-basho-1',
    target: 'ja',
    original: '古池や蛙飛び込む水の音',
    source: { author: '松尾芭蕉 (Matsuo Bashō)', year: 1686 },
    translation: { en: 'An old pond — a frog jumps in, the sound of water.' },
  },
  {
    id: 'ja-nishida-1',
    target: 'ja',
    original: '純粋経験においては、まだ知情意の分離なく、唯一の活動あるのみである。',
    source: { author: '西田幾多郎 (Nishida Kitarō)', work: '善の研究 (An Inquiry into the Good)', year: 1911 },
    translation: { en: 'In pure experience, there is yet no separation of knowing, feeling, and willing — only a single activity exists.' },
  },

  // ─── Chinese (Simplified) ─────────────────────────────────────────────────
  {
    id: 'zh-hans-laozi-1',
    target: 'zh-Hans',
    original: '知人者智，自知者明。',
    source: { author: '老子 (Laozi)', work: '道德经 (Dao De Jing)', year: -400 },
    translation: { en: 'Knowing others is intelligence; knowing yourself is wisdom.' },
  },
  {
    id: 'zh-hans-zhuangzi-1',
    target: 'zh-Hans',
    original: '天地与我并生，而万物与我为一。',
    source: { author: '庄子 (Zhuangzi)', work: '齐物论 (Discussion on Making All Things Equal)', year: -300 },
    translation: { en: 'Heaven and earth were born together with me, and all things are one with me.' },
  },
  {
    id: 'zh-hans-confucius-1',
    target: 'zh-Hans',
    original: '过而不改，是谓过矣。',
    source: { author: '孔子 (Confucius)', work: '论语 (Analects)', year: -500 },
    translation: { en: 'To have faults and not to correct them — this is a real fault.' },
  },

  // ─── Chinese (Traditional) ────────────────────────────────────────────────
  {
    id: 'zh-hant-laozi-1',
    target: 'zh-Hant',
    original: '知人者智，自知者明。',
    source: { author: '老子 (Laozi)', work: '道德經 (Dao De Jing)', year: -400 },
    translation: { en: 'Knowing others is intelligence; knowing yourself is wisdom.' },
  },
  {
    id: 'zh-hant-zhuangzi-1',
    target: 'zh-Hant',
    original: '天地與我並生，而萬物與我為一。',
    source: { author: '莊子 (Zhuangzi)', work: '齊物論 (Discussion on Making All Things Equal)', year: -300 },
    translation: { en: 'Heaven and earth were born together with me, and all things are one with me.' },
  },
  {
    id: 'zh-hant-confucius-1',
    target: 'zh-Hant',
    original: '過而不改，是謂過矣。',
    source: { author: '孔子 (Confucius)', work: '論語 (Analects)', year: -500 },
    translation: { en: 'To have faults and not to correct them — this is a real fault.' },
  },
];

/**
 * Deterministic pick: same day-of-year → same quote, so a user who completes
 * multiple entries in one day sees one consistent quote (and a new one
 * tomorrow). Day-of-year is the integer day count since Jan 1.
 */
export function pickQuoteForDay(target: TargetLang, date: Date = new Date()): PhilosopherQuote | null {
  const pool = PHILOSOPHER_QUOTES.filter(q => q.target === target);
  if (pool.length === 0) return null;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  const dayOfYear = Math.floor(diff / 86_400_000);
  return pool[dayOfYear % pool.length];
}
