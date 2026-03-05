import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SandTimerScreenProps {
  onBack: () => void;
}

const DURATIONS = [
  { minutes: 1, label: '1', color: 'hsl(var(--accent))', bgClass: 'bg-accent text-accent-foreground' },
  { minutes: 2, label: '2', color: 'hsl(var(--primary))', bgClass: 'bg-primary text-primary-foreground' },
  { minutes: 3, label: '3', color: 'hsl(32 65% 50%)', bgClass: 'bg-[hsl(32_65%_50%)] text-primary-foreground' },
  { minutes: 5, label: '5', color: 'hsl(145 30% 55%)', bgClass: 'bg-[hsl(145_30%_55%)] text-primary-foreground' },
];

type TimerState = 'picking' | 'running' | 'done';

export function SandTimerScreen({ onBack }: SandTimerScreenProps) {
  const { t, bilingual } = useLanguage();
  const [timerState, setTimerState] = useState<TimerState>('picking');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // 0 = full top, 1 = full bottom
  const startTimeRef = useRef(0);
  const durationMsRef = useRef(0);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const p = Math.min(elapsed / durationMsRef.current, 1);
    setProgress(p);
    if (p < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setTimerState('done');
    }
  }, []);

  const startTimer = (idx: number) => {
    setSelectedIdx(idx);
    setProgress(0);
    durationMsRef.current = DURATIONS[idx].minutes * 60 * 1000;
    startTimeRef.current = Date.now();
    setTimerState('running');
    rafRef.current = requestAnimationFrame(tick);
  };

  const resetTimer = () => {
    cancelAnimationFrame(rafRef.current);
    setTimerState('picking');
    setSelectedIdx(null);
    setProgress(0);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const selectedColor = selectedIdx !== null ? DURATIONS[selectedIdx].color : 'hsl(var(--primary))';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={timerState === 'running' ? resetTimer : onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('Retour', 'Back', 'Volver').primary}
          </Button>
          <h2 className="font-serif text-xl text-foreground">
            {bilingual('Sablier', 'Sand Timer', 'Reloj de arena')}
          </h2>
          <div className="w-16" />
        </div>

        {/* Duration Picker */}
        {timerState === 'picking' && (
          <div className="space-y-6 text-center animate-fade-in-up">
            <p className="text-muted-foreground text-sm">
              {t('Choisissez une durée', 'Choose a duration', 'Elige una duración').primary}
            </p>
            <div className="flex justify-center gap-4">
              {DURATIONS.map((d, i) => (
                <button
                  key={d.minutes}
                  onClick={() => startTimer(i)}
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 shadow-gentle ${d.bgClass}`}
                >
                  <span className="text-lg font-serif font-semibold">{d.label}</span>
                  <span className="text-[10px] opacity-80">min</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60">
              {t('Pas de chiffres — juste le sable', 'No numbers — just the sand', 'Sin números — solo la arena').primary}
            </p>
          </div>
        )}

        {/* Hourglass */}
        {(timerState === 'running' || timerState === 'done') && (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-40 h-72">
              {/* Glass outline */}
              <svg viewBox="0 0 160 288" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Top chamber */}
                <path
                  d="M20,8 L140,8 L140,20 Q140,120 80,140 Q20,120 20,20 Z"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="3"
                  rx="4"
                />
                {/* Bottom chamber */}
                <path
                  d="M20,280 L140,280 L140,268 Q140,168 80,148 Q20,168 20,268 Z"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="3"
                  rx="4"
                />
                {/* Top sand - shrinks as progress increases */}
                <clipPath id="topClip">
                  <path d="M22,10 L138,10 L138,20 Q138,118 80,138 Q22,118 22,20 Z" />
                </clipPath>
                <rect
                  x="20" y="10"
                  width="120"
                  height={128 * (1 - progress)}
                  fill={selectedColor}
                  opacity="0.7"
                  clipPath="url(#topClip)"
                  className="transition-none"
                />

                {/* Bottom sand - grows as progress increases */}
                <clipPath id="bottomClip">
                  <path d="M22,278 L138,278 L138,268 Q138,170 80,150 Q22,170 22,268 Z" />
                </clipPath>
                <rect
                  x="20"
                  y={278 - 128 * progress}
                  width="120"
                  height={128 * progress}
                  fill={selectedColor}
                  opacity="0.7"
                  clipPath="url(#bottomClip)"
                  className="transition-none"
                />

                {/* Falling sand stream in neck */}
                {timerState === 'running' && progress < 1 && (
                  <line
                    x1="80" y1="138"
                    x2="80" y2="150"
                    stroke={selectedColor}
                    strokeWidth="3"
                    opacity="0.6"
                    className="animate-gentle-pulse"
                  />
                )}

                {/* Top & bottom caps */}
                <rect x="12" y="2" width="136" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.15" />
                <rect x="12" y="278" width="136" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.15" />
              </svg>

              {/* Completion glow */}
              {timerState === 'done' && (
                <div
                  className="absolute inset-0 rounded-3xl animate-fade-in-up"
                  style={{
                    boxShadow: `0 0 60px ${selectedColor}`,
                    opacity: 0.25,
                  }}
                />
              )}
            </div>

            {/* Done state */}
            {timerState === 'done' && (
              <div className="text-center space-y-4 animate-fade-in-up">
                <p className="font-serif text-2xl text-foreground">
                  {t('Le temps est écoulé', "Time's up", 'Se acabó el tiempo').primary}
                </p>
                <p className="text-sm text-muted-foreground italic">
                  {t('Le temps est écoulé', "Time's up", 'Se acabó el tiempo').secondary}
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="calm" onClick={resetTimer}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    {t('Encore', 'Again', 'Otra vez').primary}
                  </Button>
                  <Button variant="default" onClick={onBack}>
                    {t('Terminé', 'Done', 'Listo').primary}
                  </Button>
                </div>
              </div>
            )}

            {/* Running - tap to cancel hint */}
            {timerState === 'running' && (
              <p className="text-xs text-muted-foreground/50 animate-fade-in-up">
                {t('Appuyez sur Retour pour annuler', 'Tap Back to cancel', 'Pulsa Volver para cancelar').primary}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
