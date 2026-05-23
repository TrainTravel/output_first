import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FocusPlanTab } from './FocusPlanTab';

interface SandTimerScreenProps {
  onBack: () => void;
}

/* ── Sand Timer durations ── */
const SAND_DURATIONS = [
  { minutes: 1, label: '1', color: 'hsl(var(--accent))', bgClass: 'bg-accent text-accent-foreground' },
  { minutes: 2, label: '2', color: 'hsl(var(--primary))', bgClass: 'bg-primary text-primary-foreground' },
  { minutes: 3, label: '3', color: 'hsl(32 65% 50%)', bgClass: 'bg-[hsl(32_65%_50%)] text-primary-foreground' },
  { minutes: 5, label: '5', color: 'hsl(145 30% 55%)', bgClass: 'bg-[hsl(145_30%_55%)] text-primary-foreground' },
];

/* ── Pomodoro presets ── */
const WORK_OPTIONS = [15, 20, 25];
const ROUND_OPTIONS = [2, 4];
const BREAK_MINUTES = 5;

type Mode = 'sand' | 'pomodoro' | 'focusplan';
type TimerState = 'picking' | 'running' | 'paused-between' | 'done';
type PomPhase = 'work' | 'break';

export function SandTimerScreen({ onBack }: SandTimerScreenProps) {
  const { t, bilingual } = useLanguage();

  // Shared
  const [mode, setMode] = useState<Mode>('sand');
  const [timerState, setTimerState] = useState<TimerState>('picking');
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(0);
  const durationMsRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Sand-specific
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Pomodoro-specific
  const [workMinutes, setWorkMinutes] = useState(25);
  const [totalRounds, setTotalRounds] = useState(4);
  const [currentRound, setCurrentRound] = useState(1);
  const [pomPhase, setPomPhase] = useState<PomPhase>('work');

  const activeColor = mode === 'sand'
    ? (selectedIdx !== null ? SAND_DURATIONS[selectedIdx].color : 'hsl(var(--primary))')
    : mode === 'focusplan' ? 'hsl(var(--accent))'
    : pomPhase === 'work' ? 'hsl(var(--primary))' : 'hsl(var(--accent))';

  /* ── Animation loop ── */
  const tick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const p = Math.min(elapsed / durationMsRef.current, 1);
    setProgress(p);
    if (p < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      handleTimerComplete();
    }
  }, []);

  const launchTimer = (ms: number) => {
    setProgress(0);
    durationMsRef.current = ms;
    startTimeRef.current = Date.now();
    setTimerState('running');
    rafRef.current = requestAnimationFrame(tick);
  };

  /* ── Sand mode start ── */
  const startSandTimer = (idx: number) => {
    setSelectedIdx(idx);
    launchTimer(SAND_DURATIONS[idx].minutes * 60 * 1000);
  };

  /* ── Pomodoro start ── */
  const startPomodoro = () => {
    setCurrentRound(1);
    setPomPhase('work');
    launchTimer(workMinutes * 60 * 1000);
  };

  const startNextPomPhase = () => {
    if (pomPhase === 'work') {
      // Start break
      setPomPhase('break');
      launchTimer(BREAK_MINUTES * 60 * 1000);
    } else {
      // Break done → next round or finish
      if (currentRound >= totalRounds) {
        setTimerState('done');
        return;
      }
      setCurrentRound(r => r + 1);
      setPomPhase('work');
      launchTimer(workMinutes * 60 * 1000);
    }
  };

  /* ── Timer complete handler ── */
  const handleTimerComplete = useCallback(() => {
    if (mode === 'sand') {
      setTimerState('done');
    } else {
      // Pomodoro: pause between phases
      if (pomPhase === 'work') {
        setTimerState('paused-between');
      } else {
        // Break finished
        setCurrentRound(r => {
          const next = r;
          if (next >= totalRounds) {
            setTimerState('done');
          } else {
            setTimerState('paused-between');
          }
          return r;
        });
      }
    }
  }, [mode, pomPhase, totalRounds]);

  // Keep tick's closure up to date
  useEffect(() => {
    // Re-bind handleTimerComplete into tick by storing latest ref
  }, [handleTimerComplete]);

  // We need tick to call the latest handleTimerComplete
  const handleCompleteRef = useRef(handleTimerComplete);
  handleCompleteRef.current = handleTimerComplete;

  // Override tick to use ref
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

  // Patch launchTimer to use tickFn
  const launchTimerFn = useCallback((ms: number) => {
    setProgress(0);
    durationMsRef.current = ms;
    startTimeRef.current = Date.now();
    setTimerState('running');
    rafRef.current = requestAnimationFrame(tickFn);
  }, [tickFn]);

  // Re-wire start functions to use launchTimerFn
  const handleStartSand = (idx: number) => {
    setSelectedIdx(idx);
    launchTimerFn(SAND_DURATIONS[idx].minutes * 60 * 1000);
  };

  const handleStartPomodoro = () => {
    setCurrentRound(1);
    setPomPhase('work');
    launchTimerFn(workMinutes * 60 * 1000);
  };

  const handleNextPomPhase = () => {
    if (pomPhase === 'work') {
      setPomPhase('break');
      launchTimerFn(BREAK_MINUTES * 60 * 1000);
    } else {
      if (currentRound >= totalRounds) {
        setTimerState('done');
        return;
      }
      setCurrentRound(r => r + 1);
      setPomPhase('work');
      launchTimerFn(workMinutes * 60 * 1000);
    }
  };

  const resetTimer = () => {
    cancelAnimationFrame(rafRef.current);
    setTimerState('picking');
    setSelectedIdx(null);
    setProgress(0);
    setCurrentRound(1);
    setPomPhase('work');
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Hourglass SVG (shared) ── */
  const renderHourglass = () => (
    <div className="relative w-40 h-72">
      <svg viewBox="0 0 160 288" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Top chamber outline */}
        <path
          d="M20,8 L140,8 L140,20 Q140,120 80,140 Q20,120 20,20 Z"
          fill="none" stroke="hsl(var(--border))" strokeWidth="3"
        />
        {/* Bottom chamber outline */}
        <path
          d="M20,280 L140,280 L140,268 Q140,168 80,148 Q20,168 20,268 Z"
          fill="none" stroke="hsl(var(--border))" strokeWidth="3"
        />

        {/* Top sand — gravity-correct: sand sits at bottom of top chamber, surface drops */}
        <clipPath id="topClip">
          <path d="M22,10 L138,10 L138,20 Q138,118 80,138 Q22,118 22,20 Z" />
        </clipPath>
        <rect
          x="20"
          y={10 + 128 * progress}
          width="120"
          height={128 * (1 - progress)}
          fill={activeColor}
          opacity="0.7"
          clipPath="url(#topClip)"
        />

        {/* Bottom sand — grows upward from chamber floor */}
        <clipPath id="bottomClip">
          <path d="M22,278 L138,278 L138,268 Q138,170 80,150 Q22,170 22,268 Z" />
        </clipPath>
        <rect
          x="20"
          y={278 - 128 * progress}
          width="120"
          height={128 * progress}
          fill={activeColor}
          opacity="0.7"
          clipPath="url(#bottomClip)"
        />

        {/* Falling sand stream */}
        {timerState === 'running' && progress < 1 && (
          <line
            x1="80" y1="138" x2="80" y2="150"
            stroke={activeColor} strokeWidth="3" opacity="0.6"
            className="animate-gentle-pulse"
          />
        )}

        {/* Top & bottom caps */}
        <rect x="12" y="2" width="136" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.15" />
        <rect x="12" y="278" width="136" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.15" />
      </svg>

      {/* Completion glow */}
      {(timerState === 'done' || timerState === 'paused-between') && (
        <div
          className="absolute inset-0 rounded-3xl animate-fade-in-up"
          style={{ boxShadow: `0 0 60px ${activeColor}`, opacity: 0.25 }}
        />
      )}
    </div>
  );

  /* ── Round dots (Pomodoro) ── */
  const renderRoundDots = () => (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: totalRounds }).map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full transition-all duration-500"
          style={{
            backgroundColor: i < currentRound - (timerState === 'running' && pomPhase === 'work' ? 1 : 0)
              ? activeColor
              : 'hsl(var(--muted))',
            opacity: i < currentRound ? 1 : 0.4,
            transform: i === currentRound - 1 ? 'scale(1.3)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={timerState === 'running' ? resetTimer : onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t({ fr: 'Retour', en: 'Back', es: 'Volver' }).primary}
          </Button>
          <h2 className="font-serif text-xl text-foreground">
            {mode === 'sand'
              ? bilingual({ fr: 'Sablier', en: 'Sand Timer', es: 'Reloj de arena' })
              : 'Pomodoro'}
          </h2>
          <div className="w-16" />
        </div>

        {/* ── Picking State ── */}
        {timerState === 'picking' && (
          <div className="space-y-6 text-center animate-fade-in-up">
            {/* Mode tabs */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="sand" className="flex-1">
                  {bilingual({ fr: 'Sablier', en: 'Sand Timer', es: 'Reloj' })}
                </TabsTrigger>
                <TabsTrigger value="pomodoro" className="flex-1">
                  Pomodoro
                </TabsTrigger>
                <TabsTrigger value="focusplan" className="flex-1">
                  {bilingual({ fr: 'Plan Focus', en: 'Focus Plan', es: 'Plan' })}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === 'focusplan' ? (
              <FocusPlanTab
                timerState={timerState}
                launchTimerFn={launchTimerFn}
                renderHourglass={renderHourglass}
                resetTimer={resetTimer}
              />
            ) : mode === 'sand' ? (
              <>
                <p className="text-muted-foreground text-sm">
                  {t({ fr: 'Choisissez une durée', en: 'Choose a duration', es: 'Elige una duración' }).primary}
                </p>
                <div className="flex justify-center gap-4">
                  {SAND_DURATIONS.map((d, i) => (
                    <button
                      key={d.minutes}
                      onClick={() => handleStartSand(i)}
                      className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 shadow-gentle ${d.bgClass}`}
                    >
                      <span className="text-lg font-serif font-semibold">{d.label}</span>
                      <span className="text-[10px] opacity-80">min</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60">
                  {t({ fr: 'Pas de chiffres — juste le sable', en: 'No numbers — just the sand', es: 'Sin números — solo la arena' }).primary}
                </p>
              </>
            ) : (
              <>
                {/* Work duration selector */}
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    {t({ fr: 'Durée de focus', en: 'Focus duration', es: 'Duración de enfoque' }).primary}
                  </p>
                  <div className="flex justify-center gap-3">
                    {WORK_OPTIONS.map(m => (
                      <button
                        key={m}
                        onClick={() => setWorkMinutes(m)}
                        className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 border-2 ${
                          workMinutes === m
                            ? 'bg-primary text-primary-foreground border-primary shadow-gentle'
                            : 'bg-card text-foreground border-border'
                        }`}
                      >
                        <span className="text-lg font-serif font-semibold">{m}</span>
                        <span className="text-[10px] opacity-80">min</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Round count selector */}
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    {t({ fr: 'Nombre de cycles', en: 'Number of rounds', es: 'Número de ciclos' }).primary}
                  </p>
                  <div className="flex justify-center gap-3">
                    {ROUND_OPTIONS.map(r => (
                      <button
                        key={r}
                        onClick={() => setTotalRounds(r)}
                        className={`px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 border-2 ${
                          totalRounds === r
                            ? 'bg-accent text-accent-foreground border-accent shadow-gentle'
                            : 'bg-card text-foreground border-border'
                        }`}
                      >
                        <span className="text-lg font-serif font-semibold">{r}</span>
                        <span className="text-sm ml-1 opacity-70">{t({ fr: 'cycles', en: 'rounds', es: 'ciclos' }).primary}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start button */}
                <Button variant="default" size="lg" onClick={handleStartPomodoro}>
                  <Play className="w-4 h-4 mr-1" />
                  {t({ fr: 'Commencer', en: 'Start', es: 'Empezar' }).primary}
                </Button>

                <p className="text-xs text-muted-foreground/60">
                  {t(
                    { fr: `${workMinutes} min focus + ${BREAK_MINUTES} min pause × ${totalRounds}`, en: `${workMinutes} min focus + ${BREAK_MINUTES} min break × ${totalRounds}`, es: `${workMinutes} min enfoque + ${BREAK_MINUTES} min pausa × ${totalRounds}` }
                  ).primary}
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Running / Paused-between / Done ── */}
        {timerState !== 'picking' && (
          <div className="flex flex-col items-center space-y-6">
            {/* Phase label (Pomodoro only) */}
            {mode === 'pomodoro' && timerState === 'running' && (
              <p className="font-serif text-lg text-foreground animate-fade-in-up">
                {pomPhase === 'work'
                  ? bilingual({ fr: 'Focus', en: 'Focus', es: 'Enfoque' })
                  : bilingual({ fr: 'Pause', en: 'Break', es: 'Pausa' })}
              </p>
            )}

            {renderHourglass()}

            {/* Round dots (Pomodoro) */}
            {mode === 'pomodoro' && renderRoundDots()}

            {/* Paused between phases (Pomodoro) */}
            {timerState === 'paused-between' && mode === 'pomodoro' && (
              <div className="text-center space-y-4 animate-fade-in-up">
                <p className="font-serif text-2xl text-foreground">
                  {pomPhase === 'work'
                    ? t({ fr: 'Temps de pause !', en: 'Break time!', es: '¡Hora de descanso!' }).primary
                    : t({ fr: 'Prêt(e) à se concentrer ?', en: 'Ready to focus?', es: '¿Listo/a para enfocarte?' }).primary}
                </p>
                <p className="text-sm text-muted-foreground italic">
                  {pomPhase === 'work'
                    ? t({ fr: 'Temps de pause !', en: 'Break time!', es: '¡Hora de descanso!' }).secondary
                    : t({ fr: 'Prêt(e) à se concentrer ?', en: 'Ready to focus?', es: '¿Listo/a para enfocarte?' }).secondary}
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="calm" onClick={resetTimer}>
                    {t({ fr: 'Arrêter', en: 'Stop', es: 'Parar' }).primary}
                  </Button>
                  <Button variant="default" onClick={handleNextPomPhase}>
                    <Play className="w-4 h-4 mr-1" />
                    {pomPhase === 'work'
                      ? t({ fr: 'Pause', en: 'Break', es: 'Pausa' }).primary
                      : t({ fr: 'Focus', en: 'Focus', es: 'Enfoque' }).primary}
                  </Button>
                </div>
              </div>
            )}

            {/* Done state */}
            {timerState === 'done' && (
              <div className="text-center space-y-4 animate-fade-in-up">
                <p className="font-serif text-2xl text-foreground">
                  {mode === 'pomodoro' && currentRound >= totalRounds
                    ? t({ fr: 'Bravo ! Tous les cycles terminés', en: 'Well done! All rounds complete', es: '¡Bravo! Todos los ciclos completados' }).primary
                    : t({ fr: 'Le temps est écoulé', en: "Time's up", es: 'Se acabó el tiempo' }).primary}
                </p>
                <p className="text-sm text-muted-foreground italic">
                  {mode === 'pomodoro' && currentRound >= totalRounds
                    ? t({ fr: 'Bravo ! Tous les cycles terminés', en: 'Well done! All rounds complete', es: '¡Bravo! Todos los ciclos completados' }).secondary
                    : t({ fr: 'Le temps est écoulé', en: "Time's up", es: 'Se acabó el tiempo' }).secondary}
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="calm" onClick={resetTimer}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    {t({ fr: 'Encore', en: 'Again', es: 'Otra vez' }).primary}
                  </Button>
                  <Button variant="default" onClick={onBack}>
                    {t({ fr: 'Terminé', en: 'Done', es: 'Listo' }).primary}
                  </Button>
                </div>
              </div>
            )}

            {/* Running hint */}
            {timerState === 'running' && (
              <p className="text-xs text-muted-foreground/50 animate-fade-in-up">
                {t({ fr: 'Appuyez sur Retour pour annuler', en: 'Tap Back to cancel', es: 'Pulsa Volver para cancelar' }).primary}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
