/**
 * Progressive Garden Growth System — Inspired by Ryōan-ji, Kenroku-en, Adachi Museum
 * 
 * Garden elements unlock as the user creates more clusters:
 *   Tier 0 (0 clusters):  Empty garden — bare raked sand
 *   Tier 1 (1-2 clusters): Stones only — bare karesansui (Ryōan-ji style)
 *   Tier 2 (3-4 clusters): Stones + Moss + Plants (Saihō-ji moss garden style)
 *   Tier 3 (5-6 clusters): All natural + water elements (Kenroku-en style)
 *   Tier 4 (7+ clusters):  Full garden + Lanterns + Bridge (Adachi Museum completeness)
 */

import stone1 from '@/assets/zen/stone-1.png';
import stone2 from '@/assets/zen/stone-2.png';
import stone3 from '@/assets/zen/stone-3.png';
import plant1 from '@/assets/zen/plant-1.png';
import plant2 from '@/assets/zen/plant-2.png';
import lantern from '@/assets/zen/lantern.png';
import tree1 from '@/assets/zen/tree-1.png';
import tree2 from '@/assets/zen/tree-2.png';
import tree3 from '@/assets/zen/tree-3.png';
import tree4 from '@/assets/zen/tree-4.png';
import lantern1 from '@/assets/zen/lantern-1.png';
import lantern2 from '@/assets/zen/lantern-2.png';
import lantern3 from '@/assets/zen/lantern-3.png';
import moss1 from '@/assets/zen/moss-1.png';
import moss2 from '@/assets/zen/moss-2.png';
import shishiOdoshi from '@/assets/zen/shishi-odoshi.png';
import tsukubai from '@/assets/zen/tsukubai.png';
import bridge from '@/assets/zen/bridge.png';

export interface GardenTier {
  level: number;          // 0-4
  label: { en: string; fr: string };
  stonePool: string[];    // images available for child stones
  anchorPool: string[];   // images available for cluster anchors
  decorPool: string[];    // ambient decorations placed in background
  progress: number;       // 0-1, how close to next tier
}

const STONES = [stone1, stone2, stone3];
const MOSS = [moss1, moss2];
const PLANTS = [plant1, plant2];
const TREES = [tree1, tree2, tree3, tree4];
const WATER = [shishiOdoshi, tsukubai];
const LANTERNS = [lantern, lantern1, lantern2, lantern3];
const BRIDGES = [bridge];

export const TIER_THRESHOLDS = [0, 1, 3, 5, 7]; // cluster counts for each tier boundary

const TIER_LABELS: { en: string; fr: string }[] = [
  { en: 'Empty garden', fr: 'Jardin vide' },
  { en: 'Stone garden', fr: 'Jardin de pierres' },       // Ryōan-ji
  { en: 'Moss garden', fr: 'Jardin de mousse' },          // Saihō-ji
  { en: 'Strolling garden', fr: 'Jardin de promenade' },  // Kenroku-en
  { en: 'Complete garden', fr: 'Jardin accompli' },        // Adachi
];

export function getGardenTier(clusterCount: number): GardenTier {
  let level = 0;
  if (clusterCount >= 7) level = 4;
  else if (clusterCount >= 5) level = 3;
  else if (clusterCount >= 3) level = 2;
  else if (clusterCount >= 1) level = 1;

  // Progress toward next tier
  const currentThreshold = TIER_THRESHOLDS[level] ?? 0;
  const nextThreshold = TIER_THRESHOLDS[level + 1] ?? currentThreshold;
  const range = nextThreshold - currentThreshold;
  const progress = range > 0
    ? Math.min(1, (clusterCount - currentThreshold) / range)
    : 1;

  // Build available pools based on tier
  let stonePool: string[];
  let anchorPool: string[];
  let decorPool: string[];

  switch (level) {
    case 0:
      stonePool = STONES.slice(0, 1);
      anchorPool = STONES.slice(0, 1);
      decorPool = [];
      break;
    case 1: // stones only — Ryōan-ji
      stonePool = [...STONES];
      anchorPool = [...STONES];
      decorPool = [];
      break;
    case 2: // + moss & plants — Saihō-ji
      stonePool = [...STONES, ...MOSS];
      anchorPool = [...STONES, ...PLANTS, ...TREES.slice(0, 2)];
      decorPool = [...MOSS];
      break;
    case 3: // + water elements — Kenroku-en
      stonePool = [...STONES, ...MOSS, ...PLANTS, ...TREES];
      anchorPool = [...STONES, ...PLANTS, ...TREES, ...WATER];
      decorPool = [...MOSS, ...WATER.slice(0, 1)];
      break;
    case 4: // full garden + lanterns + bridge — Adachi
    default:
      stonePool = [...STONES, ...MOSS, ...PLANTS, ...TREES];
      anchorPool = [...STONES, ...PLANTS, ...TREES, ...LANTERNS, ...WATER, ...BRIDGES];
      decorPool = [...MOSS, ...WATER, ...BRIDGES];
      break;
  }

  return {
    level,
    label: TIER_LABELS[level] ?? TIER_LABELS[0],
    stonePool,
    anchorPool,
    decorPool,
    progress,
  };
}

export { lantern, STONES, PLANTS, TREES, LANTERNS, MOSS, WATER, BRIDGES };
