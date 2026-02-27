/**
 * Fukinsei (不均斉) — Asymmetry & Irregularity
 * 
 * Deterministic pseudo-random placement for Zen Garden stones.
 * Uses seeded hash so positions are stable across re-renders
 * but look organic and "undesigned."
 */

// Simple hash → 0..1 from string seed
function seededRandom(seed: string, salt = 0): number {
  let h = 0xdeadbeef ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h >>> 0) / 4294967296);
}

export interface StonePosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees
  scale: number; // 0.8–1.2
}

/**
 * Rule A: Cluster Anchor Placement
 * Uses Rule of Thirds — positions anchors on the intersection 
 * of imaginary grid lines, bounded away from edges.
 */
export function anchorPosition(clusterId: string, index: number): StonePosition {
  // Rule of thirds zones: ~20-80% range, biased toward thirds intersections
  const thirdsX = [30, 65, 40, 70, 25, 55];
  const thirdsY = [30, 55, 70, 35, 60, 45];
  
  const baseX = thirdsX[index % thirdsX.length];
  const baseY = thirdsY[index % thirdsY.length];
  
  // Add bounded jitter ±12% so no two gardens look identical
  const jitterX = (seededRandom(clusterId, 1) - 0.5) * 24;
  const jitterY = (seededRandom(clusterId, 2) - 0.5) * 24;
  
  const x = Math.max(15, Math.min(85, baseX + jitterX));
  const y = Math.max(15, Math.min(85, baseY + jitterY));
  
  const rotation = (seededRandom(clusterId, 3) - 0.5) * 14;
  const scale = 0.95 + seededRandom(clusterId, 4) * 0.15;
  
  return { x, y, rotation, scale };
}

/**
 * Rule B: Thought Scattering
 * Small stones scatter within a controlled radius around their
 * cluster anchor. Radius = 8-14% of viewport. Asymmetric grouping.
 */
export function scatterPosition(
  thoughtId: string,
  anchorPos: StonePosition,
  childIndex: number,
): StonePosition {
  const angle = seededRandom(thoughtId, 10) * Math.PI * 2;
  const distance = 6 + seededRandom(thoughtId, 11) * 8; // 6–14% radius
  
  const x = Math.max(5, Math.min(95, anchorPos.x + Math.cos(angle) * distance));
  const y = Math.max(5, Math.min(95, anchorPos.y + Math.sin(angle) * distance));
  
  const rotation = (seededRandom(thoughtId, 12) - 0.5) * 20;
  const scale = 0.7 + seededRandom(thoughtId, 13) * 0.2; // smaller than anchors
  
  return { x, y, rotation, scale };
}
