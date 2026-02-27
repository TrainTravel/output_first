import { Button } from '@/components/ui/button';
import { ArrowLeft, Wind } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useThoughts } from '@/hooks/useThoughts';
import { ZenStone } from './ZenStone';
import './zen-garden.css';

interface ZenGardenScreenProps {
  onBack: () => void;
}

export function ZenGardenScreen({ onBack }: ZenGardenScreenProps) {
  const { bilingual, t } = useLanguage();
  const { thoughts, loading } = useThoughts();

  // Only show non-archived, non-composted thoughts as stones
  const stones = thoughts.filter(t => !t.archived && !t.composted);

  return (
    <div className="zen-garden-bg min-h-screen flex flex-col">
      {/* Header — minimal, lots of Ma */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="zen-text-muted">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('Retour', 'Back').primary}
        </Button>
        <h1 className="font-serif text-lg zen-text-foreground tracking-wider">
          {bilingual('Jardin Zen', 'Zen Garden')}
        </h1>
        <div className="w-16" /> {/* spacer for centering */}
      </header>

      {/* Breathing prompt — single line of calm */}
      <div className="text-center py-6">
        <p className="zen-text-muted text-sm italic tracking-wide animate-gentle-pulse">
          {t('Respirez… observez les pierres.', 'Breathe… observe the stones.').primary}
        </p>
      </div>

      {/* Stone garden — horizontal scroll, 3-stone constraint */}
      <div className="flex-1 flex items-center justify-center px-4">
        {loading ? (
          <Wind className="w-8 h-8 zen-text-muted animate-gentle-pulse" />
        ) : stones.length === 0 ? (
          <div className="text-center space-y-3">
            <div className="zen-empty-stone mx-auto" />
            <p className="zen-text-muted text-sm">
              {t(
                'Aucune pensée encore. Visitez le Vide-tête pour commencer.',
                'No thoughts yet. Visit Brain Dump to begin.'
              ).primary}
            </p>
          </div>
        ) : (
          <div
            className="zen-scroll-container flex items-center gap-12 overflow-x-auto snap-x snap-mandatory scroll-smooth px-[calc(50vw-90px)]"
            style={{ maxWidth: '100vw' }}
          >
            {stones.map((thought, i) => (
              <ZenStone key={thought.id} thought={thought} index={i} />
            ))}
            {/* Trailing empty space for scroll breathing room */}
            <div className="flex-shrink-0 w-16" aria-hidden />
          </div>
        )}
      </div>

      {/* Footer — stone count, subtle */}
      <footer className="text-center pb-8 pt-4">
        <p className="zen-text-muted text-xs tracking-widest uppercase">
          {stones.length} {t('pierres', 'stones').primary}
        </p>
      </footer>
    </div>
  );
}
