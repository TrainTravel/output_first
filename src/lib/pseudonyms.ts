// Per-language pseudonym pools for the Circulation of Love.
//
// Curated from natural imagery — no animals (overdone), no abstract emotions.
// Each entry is a complete two-word "name" the author wears for one letter.
// Lifted with care from each language's own poetic vocabulary; not machine-
// translated between languages. Native speaker review queued (see CLAUDE.md
// "Native review").

export type PseudonymLang = 'en' | 'fr' | 'es' | 'ja' | 'zh-Hans' | 'zh-Hant';

export const PSEUDONYM_POOL: Record<PseudonymLang, readonly string[]> = {
  en: [
    'Soft Wind', 'Late Light', 'Wet Grass', 'Drift Snow', 'Quiet Bell',
    'Held Stone', 'Old Bell', 'Far Hill', 'Pale Moon', 'Sea Salt',
    'Cold Spring', 'Slow River', 'Warm Rain', 'Open Sky', 'First Frost',
    'Low Tide', 'Long Shadow', 'Still Water', 'Lone Pine', 'Last Star',
  ],
  fr: [
    'Vent Doux', 'Lumière Tardive', 'Herbe Mouillée', 'Cloche Calme',
    'Mer Sombre', 'Lune Pâle', 'Petite Pluie', 'Étoile Lointaine',
    'Sel Marin', 'Source Froide', 'Vieux Pont', 'Ombre Longue',
    'Pierre Tenue', 'Marée Basse', 'Premier Gel', 'Brume du Matin',
    'Pin Solitaire', 'Dernier Astre', 'Ciel Clair', 'Rivière Lente',
  ],
  es: [
    'Viento Suave', 'Luz Tardía', 'Hierba Húmeda', 'Campana Quieta',
    'Mar Oscuro', 'Luna Pálida', 'Lluvia Suave', 'Estrella Lejana',
    'Sal del Mar', 'Fuente Fría', 'Puente Viejo', 'Sombra Larga',
    'Piedra Sostenida', 'Marea Baja', 'Primera Escarcha', 'Niebla Tempranera',
    'Pino Solitario', 'Última Estrella', 'Cielo Abierto', 'Río Lento',
  ],
  ja: [
    '小波', '夕風', '雨上がり', '月待ち', '海塩', '春寒',
    '雪兎', '灯心', '朝霧', '夜雨', '霜柱', '遠雷',
    '木漏れ日', '蛍火', '宵闇', '残雪', '川辺', '空蝉',
    '凪の海', '霧の中',
  ],
  'zh-Hans': [
    '雪落松间', '林晚风', '秋千上', '夜归人',
    '海上月', '春山雨', '远山微', '旧时灯',
    '古寺钟', '长亭外', '小桥流', '深巷雨',
    '半窗月', '云生处', '溪边石', '一线天',
    '客舟外', '南山下', '晨钟里', '碧潭深',
  ],
  'zh-Hant': [
    '雪落松間', '林晚風', '秋千上', '夜歸人',
    '海上月', '春山雨', '遠山微', '舊時燈',
    '古寺鐘', '長亭外', '小橋流', '深巷雨',
    '半窗月', '雲生處', '溪邊石', '一線天',
    '客舟外', '南山下', '晨鐘裡', '碧潭深',
  ],
};

/**
 * Cheap, deterministic 32-bit hash (FNV-1a-ish). Same input → same index, no
 * dependency on Crypto. Plenty good for selecting from a 20-item pool.
 */
export function fnvHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Picks a pseudonym deterministically from the language pool. Same
 * `(language, seed)` always returns the same name — so re-mounts and
 * page reloads on the same draft don't surprise the author.
 */
export function pickPseudonym(language: PseudonymLang, seed: string): string {
  const pool = PSEUDONYM_POOL[language];
  const index = fnvHash(seed) % pool.length;
  return pool[index];
}
