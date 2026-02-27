import { Thought } from '@/hooks/useThoughts';
import { useLanguage } from '@/contexts/LanguageContext';

import stone1 from '@/assets/zen/stone-1.png';
import stone2 from '@/assets/zen/stone-2.png';
import stone3 from '@/assets/zen/stone-3.png';

const STONE_IMAGES = [stone1, stone2, stone3];

interface ZenStoneProps {
  thought: Thought;
  index: number;
  clusterSize?: number;
}

export function ZenStone({ thought, index, clusterSize = 1 }: ZenStoneProps) {
  const { t } = useLanguage();

  const baseSize = Math.min(160, 90 + clusterSize * 15);
  const stoneImg = STONE_IMAGES[index % STONE_IMAGES.length];
  const rotation = (index * 7 - 8) % 15;

  return (
    <div
      className="zen-stone-wrapper relative flex items-center justify-center cursor-default select-none"
      style={{
        width: `${baseSize}px`,
        height: `${baseSize * 0.8}px`,
        transform: `rotate(${rotation}deg)`,
      }}
      title={thought.aiTheme || undefined}
    >
      {/* Sumi-e stone image */}
      <img
        src={stoneImg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90 mix-blend-multiply"
        draggable={false}
      />

      {/* Text overlay */}
      <p
        className="zen-stone-text relative z-10 text-center px-5 leading-snug"
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
