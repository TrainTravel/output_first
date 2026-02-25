import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface BreatheScreenProps {
  onReady: () => void;
  onBack: () => void;
}

const BREATHE_DURATION = 6000; // 6 seconds before button appears
const CYCLE_MS = 4000; // one breathe cycle

export function BreatheScreen({ onReady, onBack }: BreatheScreenProps) {
  const { t } = useLanguage();
  const [showContinue, setShowContinue] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');

  // Cycle breathing phase text
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => (p === 'inhale' ? 'exhale' : 'inhale'));
    }, CYCLE_MS / 2);
    return () => clearInterval(interval);
  }, []);

  // Reveal continue button after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowContinue(true), BREATHE_DURATION);
    return () => clearTimeout(timer);
  }, []);

  const phaseText = phase === 'inhale'
    ? t('Inspirez...', 'Breathe in...')
    : t('Expirez...', 'Breathe out...');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      <div className="w-full max-w-md flex flex-col items-center space-y-12">
        {/* Back */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t('Retour', 'Back').primary}</span>
        </button>

        {/* Breathing circle */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
          {/* Outer ring */}
          <div className="relative flex items-center justify-center">
            {/* Pulsing glow ring */}
            <div
              className="absolute w-44 h-44 rounded-full opacity-30"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)',
                animation: `breatheCircle ${CYCLE_MS}ms ease-in-out infinite`,
              }}
            />
            {/* Main breathing circle */}
            <div
              className="w-32 h-32 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center"
              style={{
                animation: `breatheCircle ${CYCLE_MS}ms ease-in-out infinite`,
              }}
            >
              {/* Inner dot */}
              <div className="w-4 h-4 rounded-full bg-primary/60" />
            </div>
          </div>

          {/* Phase instruction */}
          <div className="text-center space-y-2 min-h-[4rem]">
            <p className="font-serif text-2xl text-foreground transition-opacity duration-700">
              {phaseText.primary}
            </p>
            <p className="text-muted-foreground text-sm italic transition-opacity duration-700">
              {phaseText.secondary}
            </p>
          </div>

          {/* Grounding prompt */}
          <div className="text-center space-y-1">
            <p className="text-muted-foreground text-sm">
              {t(
                'Prenez un moment pour vous ancrer.',
                'Take a moment to ground yourself.'
              ).primary}
            </p>
            <p className="text-muted-foreground/60 text-xs italic">
              {t(
                'Prenez un moment pour vous ancrer.',
                'Take a moment to ground yourself.'
              ).secondary}
            </p>
          </div>
        </div>

        {/* Continue button — fades in after delay */}
        <div
          className="w-full transition-all duration-1000"
          style={{
            opacity: showContinue ? 1 : 0,
            transform: showContinue ? 'translateY(0)' : 'translateY(8px)',
            pointerEvents: showContinue ? 'auto' : 'none',
          }}
        >
          <Button variant="default" size="full" onClick={onReady}>
            {t('Je suis prêt(e)', "I'm ready").primary}
          </Button>
          <p className="text-center text-muted-foreground/50 text-xs mt-2 italic">
            {t('Je suis prêt(e)', "I'm ready").secondary}
          </p>
        </div>
      </div>
    </div>
  );
}
