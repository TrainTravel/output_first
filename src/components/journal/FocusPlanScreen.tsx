import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FocusPlanTab } from './FocusPlanTab';
import { RequestFilterTab } from './RequestFilterTab';

interface FocusPlanScreenProps {
  onBack: () => void;
}

type TimerState = 'picking' | 'running' | 'paused-between' | 'done';

export function FocusPlanScreen({ onBack }: FocusPlanScreenProps) {
  const { t, bilingual } = useLanguage();

  const [timerState, setTimerState] = useState<TimerState>('picking');
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('filter');
  const [prefillGoal, setPrefillGoal] = useState('');
  const startTimeRef = useRef(0);
  const durationMsRef = useRef(0);
  const rafRef = useRef<number>(0);
  const handleCompleteRef = useRef(() => setTimerState('done'));

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

  const launchTimerFn = useCallback((ms: number) => {
    setProgress(0);
    durationMsRef.current = ms;
    startTimeRef.current = Date.now();
    setTimerState('running');
    rafRef.current = requestAnimationFrame(tickFn);
  }, [tickFn]);

  const resetTimer = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setTimerState('picking');
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleSelectGoal = (goal: string) => {
    setPrefillGoal(goal);
    setActiveTab('focus');
  };

  const renderHourglass = () => (
    <div className="relative w-40 h-72">
      <svg viewBox="0 0 160 288" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M20,8 L140,8 L140,20 Q140,120 80,140 Q20,120 20,20 Z" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
        <path d="M20,280 L140,280 L140,268 Q140,168 80,148 Q20,168 20,268 Z" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />

        <clipPath id="fpTopClip">
          <path d="M22,10 L138,10 L138,20 Q138,118 80,138 Q22,118 22,20 Z" />
        </clipPath>
        <rect x="20" y={10 + 128 * progress} width="120" height={128 * (1 - progress)} fill={activeColor} opacity="0.7" clipPath="url(#fpTopClip)" />

        <clipPath id="fpBottomClip">
          <path d="M22,278 L138,278 L138,268 Q138,170 80,150 Q22,170 22,268 Z" />
        </clipPath>
        <rect x="20" y={278 - 128 * progress} width="120" height={128 * progress} fill={activeColor} opacity="0.7" clipPath="url(#fpBottomClip)" />

        {timerState === 'running' && progress < 1 && (
          <line x1="80" y1="138" x2="80" y2="150" stroke={activeColor} strokeWidth="3" opacity="0.6" className="animate-gentle-pulse" />
        )}

        <rect x="12" y="2" width="136" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.15" />
        <rect x="12" y="278" width="136" height="8" rx="4" fill="hsl(var(--foreground))" opacity="0.15" />
      </svg>

      {timerState === 'done' && (
        <div className="absolute inset-0 rounded-3xl animate-fade-in-up" style={{ boxShadow: `0 0 60px ${activeColor}`, opacity: 0.25 }} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={timerState === 'running' ? resetTimer : onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t({ fr: 'Retour', en: 'Back', es: 'Volver' }).primary}
          </Button>
          <h2 className="font-serif text-xl text-foreground">
            {bilingual({ fr: 'Un truc à la fois', en: 'One Thing', es: 'Una cosa' })}
          </h2>
          <div className="w-16" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="filter" className="flex-1">
              {t({ fr: 'Filtre', en: 'Filter', es: 'Filtro' }).primary}
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex-1">
              {t({ fr: 'Focus', en: 'Focus', es: 'Enfoque' }).primary}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filter">
            <RequestFilterTab onSelectGoal={handleSelectGoal} />
          </TabsContent>

          <TabsContent value="focus">
            <FocusPlanTab
              timerState={timerState}
              launchTimerFn={launchTimerFn}
              renderHourglass={renderHourglass}
              resetTimer={resetTimer}
              prefillGoal={prefillGoal}
              onPrefillConsumed={() => setPrefillGoal('')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
