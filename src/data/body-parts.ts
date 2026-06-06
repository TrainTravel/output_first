import type { Translations } from '@/contexts/LanguageContext';

export interface BodyPart {
  id: string;
  /** Normalized vertical position 0..1 (0 = top of silhouette, 1 = bottom) */
  yNorm: number;
  /** Label x-position as % of container (0 = far left, 100 = far right) */
  xPercent: number;
  label: Translations;
}

export const BODY_PARTS: BodyPart[] = [
  {
    id: 'head',
    yNorm: 0.10,
    xPercent: 50,
    label: { fr: 'tête', en: 'head', es: 'cabeza', ja: '頭(あたま)', 'zh-Hans': '头', 'zh-Hant': '頭' },
  },
  {
    id: 'shoulders',
    yNorm: 0.22,
    xPercent: 82,
    label: { fr: 'épaules', en: 'shoulders', es: 'hombros', ja: '肩(かた)', 'zh-Hans': '肩膀', 'zh-Hant': '肩膀' },
  },
  {
    id: 'chest',
    yNorm: 0.33,
    xPercent: 18,
    label: { fr: 'poitrine', en: 'chest', es: 'pecho', ja: '胸(むね)', 'zh-Hans': '胸口', 'zh-Hant': '胸口' },
  },
  {
    id: 'belly',
    yNorm: 0.47,
    xPercent: 82,
    label: { fr: 'ventre', en: 'belly', es: 'vientre', ja: 'お腹(なか)', 'zh-Hans': '腹部', 'zh-Hant': '腹部' },
  },
  {
    id: 'hands',
    yNorm: 0.60,
    xPercent: 18,
    label: { fr: 'mains', en: 'hands', es: 'manos', ja: '手(て)', 'zh-Hans': '双手', 'zh-Hant': '雙手' },
  },
  {
    id: 'legs',
    yNorm: 0.80,
    xPercent: 82,
    label: { fr: 'jambes', en: 'legs', es: 'piernas', ja: '脚(あし)', 'zh-Hans': '腿', 'zh-Hant': '腿' },
  },
];
