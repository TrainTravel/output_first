import { Thought } from '@/hooks/useThoughts';
import { PLANTS, TREES, LANTERNS, MOSS, WATER, BRIDGES } from './gardenTiers';

interface ZenStoneProps {
  thought: Thought;
  index: number;
  clusterSize?: number;
  elementPool?: string[];  // available images based on garden tier
}

export function ZenStone({ thought, index, clusterSize = 1, elementPool = [] }: ZenStoneProps) {
  const baseSize = Math.min(160, 90 + clusterSize * 15);
  const elementImg = elementPool.length > 0
    ? elementPool[index % elementPool.length]
    : undefined;
  const isPlant = elementImg ? PLANTS.includes(elementImg) : false;
  const isTree = elementImg ? TREES.includes(elementImg) : false;
  const isLantern = elementImg ? LANTERNS.includes(elementImg) : false;
  const isMoss = elementImg ? MOSS.includes(elementImg) : false;
  const isWater = elementImg ? WATER.includes(elementImg) : false;
  const isBridge = elementImg ? BRIDGES.includes(elementImg) : false;
  const isOrganic = isPlant || isTree || isMoss;
  const rotation = isOrganic || isLantern || isWater || isBridge ? 0 : (index * 7 - 8) % 15;
  const sizeMultiplier = isTree ? 1.4 : isLantern || isWater ? 1.3 : isPlant || isBridge ? 1.2 : isMoss ? 1.1 : 1;

  return (
    <div
      className="zen-stone-wrapper relative flex items-center justify-center cursor-default select-none"
      style={{
        width: `${baseSize * sizeMultiplier}px`,
        height: `${baseSize * 0.8 * sizeMultiplier}px`,
        transform: `rotate(${rotation}deg)`,
      }}
      title={thought.aiTheme || undefined}
    >
      <img
        src={elementImg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-95"
        draggable={false}
      />

      {/* Text overlay */}
      <p
        className="zen-stone-text relative z-10 text-center px-5 leading-snug drop-shadow-sm"
        style={{ transform: `rotate(${-rotation}deg)` }}
      >
        {thought.content.length > 50
          ? thought.content.slice(0, 47) + '…'
          : thought.content}
      </p>

      {thought.aiTheme && (
        <span
          className="zen-stone-theme absolute -bottom-5 text-[10px] tracking-widest uppercase opacity-60 z-10"
          style={{ transform: `rotate(${-rotation}deg)` }}
        >
          {thought.aiTheme}
        </span>
      )}
    </div>
  );
}
