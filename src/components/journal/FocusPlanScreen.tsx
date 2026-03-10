import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FocusPlanScreenProps {
  onBack: () => void;
}

type Phase = 'entry' | 'running' | 'done';

const PLACEHOLDERS = {
  fr: [
    'Regarder par la fenêtre',
    "Boire un verre d'eau",
    'Mettre mes chaussures',
    'Ouvrir le document',
    "S'asseoir sur le canapé",
  ],
  en: [
    'Look out the window',
    'Drink a glass of water',
    'Put on my shoes',
    'Open the document',
    'Sit on the couch',
  ],
  es: [
    'Mirar por la ventana',
    'Beber un vaso de agua',
    'Ponerme los zapatos',
    'Abrir el documento',
    'Sentarme en el sofá',
  ],
};

const BASE_DURATION_MS = 5 * 60 * 1000;

function HourglassSvg({
  progress,
  activeColor,
  isRunning,
  isDone,
}: {
  progress: number;
  activeColor: string;
  isRunning: boolean;
  isDone: boolean;
}) {
  return (
    <div className="relative w-40 h-72">
      <svg viewBox="0 0 160 288" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M20,8 L140,8 L140,20 Q140,120 80,140 Q20,120 20,20 Z" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
        <path d="M20,280 L140,280 L140,268 Q140,168 80,148 Q20,168 20,268 Z" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />

        <clipPath id="fpTopClip">
          <path d="M22,10 L138,10 L138,20 Q138,118 80,138 Q22,118 22,20 Z" />
        </clipPath>
        <rect
          x="20"
          y={10 + 128 * progress}
          width="120"
          height={128 * (1 - progress)}
          fill={activeColor}
          opacity="0.7"
          clipPath="url(#fpTopClip)"
        />

        <clipPath id="fpBottomClip">
          <path d="M22,278 L138,278 L138,268 Q138,170 80,150 Q22,170 22,268 Z" />
        </clipPath>
        <rect
          x="20"
          y={278 - 128 * progress}
          width="120"
          height={128 * progress}
          fill={activeColor}
          opacity="0.7"
          clipPath="url(#fpBottomClip)"
        />

        {isRunning && progress < 1 && (
          <line x1="80" y1="138" x2="80" y2="150" stroke={activeColor} strokeWidth="3" opacity="0.6" className="animate-gentle-pulse" />
        )}

        <rect x="12" y="2" width="136" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.15" />
        <rect x="12" y="278" width="136" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.15" />
      </svg>

      {isDone && (
        <div
          className="absolute inset-0 rounded-3xl animate-fade-in-up"
          style={{ boxShadow: `0 0 60px ${activeColor}`, opacity: 0.25 }}
        />
      )}
    </div>
  );
}

export function FocusPlanScreen({ onBack }: FocusPlanScreenProps) {
  const { t, bilingual, lang } = useLanguage();

  const [phase, setPhase] = useState<Phase>('entry');
  const [label, setLabel] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const startTimeRef = useRef<number>(0);
  const durationMsRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const handleCompleteRef = useRef<() => void>(() => setPhase('done'));

  handleCompleteRef.current = () => setPhase('done');

  const activeColor = 'hsl(var(--accent))';

  const tickFn = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const p = Math.min(elapsed / durationMsRef.current, 1);
    setProgress(p);
    if (p < 1) {
      rafRef.current = requestAnimationFrame(tickFn);
    } else {
      handleCompleteRef.current();
    }
  }, []);

  const launchTimer = useCallback(
    (ms: number) => {
      cancelAnimationFrame(rafRef.current);
      setProgress(0);
      durationMsRef.current = ms;
      startTimeRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tickFn);
    },
    [tickFn],
  );

  const extendTimer = useCallback(() => {
    durationMsRef.current += 5 * 60 * 1000;
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Rotate placeholders every 3s in entry phase only
  useEffect(() => {
    if (phase !== 'entry') return;
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % 5), 3000);
    return () => clearInterval(id);
  }, [phase]);

  const placeholders = PLACEHOLDERS[lang as keyof typeof PLACEHOLDERS] ?? PLACEHOLDERS.en;

  const handleJustStart = () => {
    setLabel('');
    launchTimer(BASE_DURATION_MS);
    setPhase('running');
  };

  const handleKeepThis = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setLabel(trimmed);
    launchTimer(BASE_DURATION_MS);
    setPhase('running');
  };

  const resetToEntry = () => {
    cancelAnimationFrame(rafRef.current);
    setInputValue('');
    setLabel('');
    setProgress(0);
    setPhase('entry');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={phase === 'entry' ? onBack : resetToEntry}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('Retour', 'Back', 'Volver').primary}
          </Button>
          <h2 className="font-serif text-xl text-foreground">
            {bilingual('Un truc à la fois', 'One Thing at a Time', 'Una cosa a la vez')}
          </h2>
          <div className="w-16" />
        </div>

        {/* Entry phase */}
        {phase === 'entry' && (
          <div className="space-y-6 animate-fade-in-up">
            <p className="font-serif text-lg text-foreground text-center">
              {t('Sur quoi est-ce que tu butines ?', "What's pulling at your attention?", '¿Qué ocupa tu atención?').primary}
            </p>

            <textarea
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 font-sans text-sm"
              rows={1}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputValue.trim()) handleKeepThis();
                }
              }}
              placeholder={placeholders[placeholderIdx]}
            />

            <div className="space-y-3">
              <Button variant="accent" size="full" onClick={handleJustStart}>
                {t('Juste commencer', 'Just Start', 'Solo empezar').primary}
              </Button>
              {inputValue.trim() && (
                <Button variant="calm" size="full" className="animate-fade-in-up" onClick={handleKeepThis}>
                  {t('Garder ça', 'Keep This', 'Quedarse con eso').primary}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Running phase */}
        {phase === 'running' && (
          <div className="flex flex-col items-center space-y-6 animate-fade-in-up">
            {label && (
              <p className="text-sm text-muted-foreground text-center">{label}</p>
            )}

            <HourglassSvg progress={progress} activeColor={activeColor} isRunning={true} isDone={false} />

            <p className="text-xs text-muted-foreground/60 italic text-center">
              {t("Les mains d'abord.", 'Hands first.', 'Manos primero.').primary}
            </p>

            <div className="flex gap-4 justify-center">
              <Button variant="ghost" size="sm" onClick={extendTimer}>
                +5 min
              </Button>
              <Button variant="ghost" size="sm" onClick={resetToEntry}>
                {t('Laisser tomber', 'Drop it', 'Dejarlo').primary}
              </Button>
            </div>
          </div>
        )}

        {/* Done phase */}
        {phase === 'done' && (
          <div className="flex flex-col items-center space-y-6 animate-fade-in-up">
            <HourglassSvg progress={1} activeColor={activeColor} isRunning={false} isDone={true} />

            <p className="font-serif text-xl text-foreground text-center">
              {t("C'est fait.", 'Done.', 'Listo.').primary}
            </p>

            <div className="space-y-3 w-full">
              <Button
                variant="calm"
                size="full"
                onClick={() => {
                  launchTimer(BASE_DURATION_MS);
                  setPhase('running');
                }}
              >
                {t('Encore 5 min', '5 more min', '5 min más').primary}
              </Button>
              <Button variant="default" size="full" onClick={onBack}>
                {t('Retour', 'Back', 'Volver').primary}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
