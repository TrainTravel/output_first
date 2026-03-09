import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, Play, ArrowRight, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type PlanPhase = 'naming' | 'breaking' | 'stepping';
type TimerState = 'picking' | 'running' | 'paused-between' | 'done';

interface PlanStep {
  text: string;
  done: boolean;
}

/* Duration options reused from sand timer */
const STEP_DURATIONS = [
  { minutes: 1, label: '1' },
  { minutes: 2, label: '2' },
  { minutes: 3, label: '3' },
  { minutes: 5, label: '5' },
];

interface FocusPlanTabProps {
  timerState: TimerState;
  launchTimerFn: (ms: number) => void;
  renderHourglass: () => React.ReactNode;
  resetTimer: () => void;
  onPlanReset?: () => void;
  prefillGoal?: string;
  onPrefillConsumed?: () => void;
}

export function FocusPlanTab({
  timerState,
  launchTimerFn,
  renderHourglass,
  resetTimer,
  onPlanReset,
  prefillGoal,
  onPrefillConsumed,
}: FocusPlanTabProps) {
  const { t, bilingual } = useLanguage();

  const [phase, setPhase] = useState<PlanPhase>('naming');
  const [goal, setGoal] = useState('');
  const [steps, setSteps] = useState<PlanStep[]>([]);
  const [newStep, setNewStep] = useState('');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholders = [
    t('Mettre mes chaussures', 'Put on my shoes', 'Ponerme los zapatos').primary,
    t('Remplir ma bouteille d\'eau', 'Fill my water bottle', 'Llenar mi botella de agua').primary,
    t('Sortir de la maison', 'Walk out the front door', 'Salir por la puerta').primary,
    t('Conduire au sentier', 'Drive to the trailhead', 'Conducir al sendero').primary,
  ];

  const handleGoalSubmit = () => {
    if (!goal.trim()) return;
    setPhase('breaking');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const addStep = () => {
    if (!newStep.trim() || steps.length >= 5) return;
    setSteps([...steps, { text: newStep.trim(), done: false }]);
    setNewStep('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const startStepping = () => {
    setPhase('stepping');
    setActiveStepIdx(0);
    setShowDurationPicker(true);
  };

  const handleDurationPick = (minutes: number) => {
    setShowDurationPicker(false);
    launchTimerFn(minutes * 60 * 1000);
  };

  const handleStepComplete = () => {
    // Mark current step done
    setSteps(prev => prev.map((s, i) => i === activeStepIdx ? { ...s, done: true } : s));

    // Find next undone step
    const nextIdx = steps.findIndex((s, i) => i > activeStepIdx && !s.done);
    if (nextIdx >= 0) {
      setActiveStepIdx(nextIdx);
      setShowDurationPicker(true);
      resetTimer();
    }
    // If no more steps, timerState will be 'done' from parent
  };

  const allDone = steps.length > 0 && steps.every(s => s.done);
  const completedCount = steps.filter(s => s.done).length;

  const fullReset = () => {
    setPhase('naming');
    setGoal('');
    setSteps([]);
    setNewStep('');
    setActiveStepIdx(0);
    setShowDurationPicker(false);
    resetTimer();
    onPlanReset?.();
  };

  /* ── Naming phase ── */
  if (phase === 'naming') {
    return (
      <div className="space-y-6 text-center animate-fade-in-up">
        <p className="font-serif text-lg text-foreground">
          {t('Qu\'est-ce que tu veux faire ?', 'What do you want to do?', '¿Qué quieres hacer?').primary}
        </p>
        <p className="text-sm text-muted-foreground italic">
          {t('Qu\'est-ce que tu veux faire ?', 'What do you want to do?', '¿Qué quieres hacer?').secondary}
        </p>

        <div className="space-y-3">
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGoalSubmit()}
            placeholder={t('Aller randonner', 'Go hiking', 'Ir a caminar').primary}
            className="text-center font-serif text-lg h-12"
            autoFocus
          />
          <Button
            variant="default"
            onClick={handleGoalSubmit}
            disabled={!goal.trim()}
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            {t('Continuer', 'Continue', 'Continuar').primary}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60">
          {t(
            'Une seule chose — on la découpe après',
            'One thing — we\'ll break it down next',
            'Una sola cosa — la dividimos después'
          ).primary}
        </p>
      </div>
    );
  }

  /* ── Breaking phase ── */
  if (phase === 'breaking') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        {/* Goal display */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('Ton truc', 'Your thing', 'Tu cosa').primary}:
          </p>
          <p className="font-serif text-xl text-foreground">{goal}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            {t(
              'Quel est le plus petit premier pas ?',
              'What\'s the smallest first step?',
              '¿Cuál es el paso más pequeño?'
            ).primary}
          </p>

          {/* Existing steps */}
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border"
              >
                <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                <span className="text-foreground text-sm">{step.text}</span>
              </div>
            ))}
          </div>

          {/* Add step input */}
          {steps.length < 5 && (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStep()}
                placeholder={placeholders[steps.length] ?? placeholders[0]}
                className="flex-1 text-sm"
                autoFocus
              />
              <Button
                variant="outline"
                size="icon"
                onClick={addStep}
                disabled={!newStep.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {steps.length >= 5 && (
            <p className="text-xs text-muted-foreground/60 text-center">
              {t('5 pas maximum — on garde ça simple', '5 steps max — keeping it simple', '5 pasos máximo — manteniéndolo simple').primary}
            </p>
          )}
        </div>

        {/* Start button */}
        {steps.length > 0 && (
          <div className="text-center">
            <Button variant="default" onClick={startStepping}>
              <Play className="w-4 h-4 mr-1" />
              {t('Premier pas', 'First step', 'Primer paso').primary}
            </Button>
          </div>
        )}
      </div>
    );
  }

  /* ── Stepping phase ── */
  return (
    <div className="flex flex-col items-center space-y-6 animate-fade-in-up">
      {/* Goal reminder */}
      <p className="text-sm text-muted-foreground font-serif">{goal}</p>

      {/* Step list with progress */}
      <div className="w-full space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
              step.done
                ? 'bg-primary/10 border border-primary/20'
                : i === activeStepIdx
                  ? 'bg-accent/10 border-2 border-accent shadow-gentle'
                  : 'bg-card border border-border opacity-50'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              step.done
                ? 'bg-primary text-primary-foreground'
                : i === activeStepIdx
                  ? 'border-2 border-accent bg-accent/20'
                  : 'border-2 border-muted'
            }`}>
              {step.done && <Check className="w-3 h-3" />}
            </div>
            <span className={`text-sm ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {step.text}
            </span>
          </div>
        ))}
      </div>

      {/* Duration picker (before timer starts) */}
      {showDurationPicker && timerState === 'picking' && (
        <div className="space-y-3 text-center animate-fade-in-up">
          <p className="text-sm text-muted-foreground">
            {t('Combien de temps ?', 'How long?', '¿Cuánto tiempo?').primary}
          </p>
          <div className="flex justify-center gap-3">
            {STEP_DURATIONS.map((d) => (
              <button
                key={d.minutes}
                onClick={() => handleDurationPick(d.minutes)}
                className="w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 bg-accent text-accent-foreground shadow-gentle"
              >
                <span className="text-lg font-serif font-semibold">{d.label}</span>
                <span className="text-[10px] opacity-80">min</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hourglass while running */}
      {timerState === 'running' && (
        <>
          {renderHourglass()}
          <p className="text-xs text-muted-foreground/50">
            {steps[activeStepIdx]?.text}
          </p>
        </>
      )}

      {/* Step done → prompt next or show all-done */}
      {timerState === 'done' && !allDone && (
        <div className="text-center space-y-4 animate-fade-in-up">
          <p className="font-serif text-xl text-foreground">
            {t('Bien joué !', 'Nice one!', '¡Bien hecho!').primary}
          </p>
          <Button variant="default" onClick={handleStepComplete}>
            <ArrowRight className="w-4 h-4 mr-1" />
            {t('Prêt(e) pour la suite ?', 'Ready for the next one?', '¿Listo/a para el siguiente?').primary}
          </Button>
          <div>
            <Button variant="calm" size="sm" onClick={fullReset}>
              {t('Arrêter ici', 'Stop here', 'Parar aquí').primary}
            </Button>
          </div>
        </div>
      )}

      {/* All steps done */}
      {(allDone || (timerState === 'done' && activeStepIdx >= steps.length - 1 && steps[activeStepIdx]?.done)) && (
        <div className="text-center space-y-4 animate-fade-in-up">
          <p className="font-serif text-2xl text-foreground">
            {t('Tu as fait tout ça !', 'You did all of that!', '¡Hiciste todo eso!').primary}
          </p>
          <p className="text-sm text-muted-foreground italic">
            {t('Tu as fait tout ça !', 'You did all of that!', '¡Hiciste todo eso!').secondary}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="calm" onClick={fullReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              {t('Encore', 'Again', 'Otra vez').primary}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
