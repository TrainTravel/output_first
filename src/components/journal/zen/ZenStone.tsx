import { Thought } from '@/hooks/useThoughts';
import { useLanguage } from '@/contexts/LanguageContext';

// Organic border-radius presets to make each stone feel unique
const STONE_SHAPES = [
  '60% 40% 55% 45% / 50% 60% 40% 50%',
  '45% 55% 50% 50% / 55% 45% 50% 50%',
  '55% 45% 40% 60% / 45% 55% 55% 45%',
];

interface ZenStoneProps {
  thought: Thought;
  index: number;
  clusterSize?: number; // larger cluster = larger stone
}

export function ZenStone({ thought, index, clusterSize = 1 }: ZenStoneProps) {
  const { t } = useLanguage();
  
  // Scale stone size based on content length / cluster importance
  const baseSize = Math.min(180, 100 + clusterSize * 20);
  const shape = STONE_SHAPES[index % STONE_SHAPES.length];
  
  // Slight organic rotation per stone
  const rotation = (index * 7 - 8) % 15;

  return (
    <div
      className="zen-stone flex-shrink-0 snap-center flex items-center justify-center cursor-default select-none"
      style={{
        width: `${baseSize}px`,
        height: `${baseSize * 0.75}px`,
        borderRadius: shape,
        transform: `rotate(${rotation}deg)`,
      }}
      title={thought.aiTheme || undefined}
    >
      <p
        className="zen-stone-text text-center px-4 leading-snug"
        style={{ transform: `rotate(${-rotation}deg)` }}
      >
        {thought.content.length > 60
          ? thought.content.slice(0, 57) + '…'
          : thought.content}
      </p>
      {thought.aiTheme && (
        <span
          className="zen-stone-theme absolute -bottom-5 text-[10px] tracking-widest uppercase opacity-60"
          style={{ transform: `rotate(${-rotation}deg)` }}
        >
          {thought.aiTheme}
        </span>
      )}
    </div>
  );
}
