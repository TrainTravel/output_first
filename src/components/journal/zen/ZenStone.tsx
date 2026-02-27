import { Thought } from '@/hooks/useThoughts';

import stone1 from '@/assets/zen/stone-1.png';
import stone2 from '@/assets/zen/stone-2.png';
import stone3 from '@/assets/zen/stone-3.png';
import plant1 from '@/assets/zen/plant-1.png';
import plant2 from '@/assets/zen/plant-2.png';

const STONE_IMAGES = [stone1, stone2, stone3];
const PLANT_IMAGES = [plant1, plant2];
const ALL_ELEMENTS = [...STONE_IMAGES, ...PLANT_IMAGES];

interface ZenStoneProps {
  thought: Thought;
  index: number;
  clusterSize?: number;
}

export function ZenStone({ thought, index, clusterSize = 1 }: ZenStoneProps) {
  const baseSize = Math.min(160, 90 + clusterSize * 15);
  const elementImg = ALL_ELEMENTS[index % ALL_ELEMENTS.length];
  const isPlant = PLANT_IMAGES.includes(elementImg);
  const rotation = isPlant ? 0 : (index * 7 - 8) % 15;
  const sizeMultiplier = isPlant ? 1.2 : 1;

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
