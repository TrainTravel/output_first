import { useMemo } from 'react';

interface ZenAmbientDecorProps {
  decorPool: string[];
  clusterCount: number;
}

/**
 * Ambient background decorations — moss patches, water features
 * placed at fixed organic positions to give the garden life.
 * These are non-interactive, decorative only.
 */
export function ZenAmbientDecor({ decorPool, clusterCount }: ZenAmbientDecorProps) {
  const decorations = useMemo(() => {
    if (decorPool.length === 0) return [];

    // Fixed positions inspired by famous garden layouts
    const positions = [
      { x: 8, y: 75, scale: 0.6, rotation: 5 },
      { x: 88, y: 82, scale: 0.5, rotation: -8 },
      { x: 15, y: 25, scale: 0.4, rotation: 12 },
      { x: 92, y: 20, scale: 0.45, rotation: -3 },
      { x: 50, y: 90, scale: 0.55, rotation: 0 },
    ];

    // Show more decorations as garden grows
    const count = Math.min(positions.length, Math.max(1, Math.floor(clusterCount / 2)));

    return positions.slice(0, count).map((pos, i) => ({
      ...pos,
      img: decorPool[i % decorPool.length],
      delay: i * 0.5,
    }));
  }, [decorPool, clusterCount]);

  if (decorations.length === 0) return null;

  return (
    <>
      {decorations.map((d, i) => (
        <div
          key={i}
          className="absolute zen-decor z-0"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            transform: `translate(-50%, -50%) rotate(${d.rotation}deg) scale(${d.scale})`,
            animationDelay: `${d.delay}s`,
          }}
        >
          <img
            src={d.img}
            alt=""
            aria-hidden="true"
            className="w-24 h-24 object-contain"
            draggable={false}
          />
        </div>
      ))}
    </>
  );
}
