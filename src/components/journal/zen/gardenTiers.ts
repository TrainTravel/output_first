/**
 * Progressive Garden Growth System
 * 
 * Garden elements unlock as the user creates more clusters:
 *   Tier 1 (1-2 clusters): Stones only — bare karesansui
 *   Tier 2 (3-4 clusters): Stones + Plants (bonsai, moss)
 *   Tier 3 (5-6 clusters): All natural elements
 *   Tier 4 (7+ clusters):  Full garden + Stone Lantern (tōrō) capstone
 */

import stone1 from '@/assets/zen/stone-1.png';
import stone2 from '@/assets/zen/stone-2.png';
import stone3 from '@/assets/zen/stone-3.png';
import plant1 from '@/assets/zen/plant-1.png';
import plant2 from '@/assets/zen/plant-2.png';
import lantern from '@/assets/zen/lantern.png';

export interface GardenTier {
  level: number;          // 1-4
  label: { en: string; fr: string };
  stonePool: string[];    // images available for child stones
  anchorPool: string[];   // images available for cluster anchors
  progress: number;       // 0-1, how close to next tier
}

const STONES = [stone1, stone2, stone3];
const PLANTS = [plant1, plant2];

export const TIER_THRESHOLDS = [0, 1, 3, 5, 7]; // cluster counts for each tier boundary

const TIER_LABELS: { en: string; fr: string }[] = [
  { en: 'Empty garden', fr: 'Jardin vide' },
  { en: 'Stone garden', fr: 'Jardin de pierres' },
  { en: 'Growing garden', fr: 'Jardin naissant' },
  { en: 'Flourishing garden', fr: 'Jardin florissant' },
  { en: 'Complete garden', fr: 'Jardin accompli' },
];

export function getGardenTier(clusterCount: number): GardenTier {
  let level = 1;
  if (clusterCount >= 7) level = 4;
  else if (clusterCount >= 5) level = 3;
  else if (clusterCount >= 3) level = 2;
  else if (clusterCount >= 1) level = 1;
  else level = 0;

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

  switch (level) {
    case 0:
      stonePool = STONES.slice(0, 1);
      anchorPool = STONES.slice(0, 1);
      break;
    case 1: // stones only
      stonePool = [...STONES];
      anchorPool = [...STONES];
      break;
    case 2: // + plants
      stonePool = [...STONES, ...PLANTS];
      anchorPool = [...STONES, ...PLANTS];
      break;
    case 3: // all natural
      stonePool = [...STONES, ...PLANTS];
      anchorPool = [...STONES, ...PLANTS];
      break;
    case 4: // + lantern capstone
    default:
      stonePool = [...STONES, ...PLANTS];
      anchorPool = [...STONES, ...PLANTS, lantern];
      break;
  }

  return {
    level,
    label: TIER_LABELS[level] ?? TIER_LABELS[0],
    stonePool,
    anchorPool,
    progress,
  };
}

export { lantern, STONES, PLANTS };
