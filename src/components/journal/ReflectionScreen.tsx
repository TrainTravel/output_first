import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Loader2, Heart } from 'lucide-react';
import { MAX_CYCLES, ReflectionCycle } from '@/types/journal';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { SelfCompassionPractice } from './SelfCompassionPractice';
import { isStruggling } from '@/hooks/useSelfCompassion';

interface ReflectionScreenProps {
  journalContent: string;
  emotions?: string;
  emotionsFr?: string;
  currentCycle: number;
  canMoveToGratitude: boolean;
  reflectionCycles: ReflectionCycle[];
  onContinue: (reflectionResponse?: string, moveToGratitude?: boolean, aiQuestion?: string, aiReflection?: string) => void;
  onBack: () => void;
}

interface ReflectionData {
  reflection: string;
  question: string;
}

export function ReflectionScreen({
  journalContent,
  emotions,
  emotionsFr,
  currentCycle,
  canMoveToGratitude,
  reflectionCycles,
  onContinue,
  onBack
}: ReflectionScreenProps) {
  const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);
  const { bilingual, t, targetLang, primaryLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';

  useEffect(() => {
    generateReflection();
  }, []);

  const generateReflection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reflection`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            journalContent,
            emotions: emotionsFr || emotions || 'none selected',
            previousCycles: reflectionCycles.length > 0 ? reflectionCycles : undefined,
            lang: targetLang,
            primaryLang,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.code
          ? `${errorData.error || 'Failed'} (${errorData.code})`
          : errorData.error || 'Failed to generate reflection';
        throw new Error(errorMsg);
      }

      const data = await res.json();
      if (data?.error) {
        const errorMsg = data.code
          ? `${data.error} (${data.code})`
          : data.error;
        throw new Error(errorMsg);
      }
      setReflectionData(data);
      // Delay showing the question so user reads the reflection first
      setTimeout(() => setShowQuestion(true), 2500);
    } catch (err) {
      console.error('Error generating reflection:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`${errorMessage}. You can continue to the next step.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueExploring = () => onContinue(response.trim() || undefined, false, reflectionData?.question, reflectionData?.reflection);
  const handleMoveToGratitude = () => onContinue(response.trim() || undefined, true, reflectionData?.question, reflectionData?.reflection);
  const handleSkip = () => onContinue(undefined, true);

  const isLastCycle = currentCycle >= MAX_CYCLES - 1;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Header with cycle indicator */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">{t('Retour', 'Back', 'Volver').primary}</span>
          </button>

          {/* Cycle dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: MAX_CYCLES }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= currentCycle ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
            <p className="text-muted-foreground text-sm">
              {t('Prenant un moment pour réfléchir...', 'Taking a moment to reflect...', 'Tomando un momento para reflexionar...').primary}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 flex flex-col">
            <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
            <div className="mt-auto">
              <Button variant="default" size="full" onClick={handleSkip}>
                <ArrowRight className="w-5 h-5 mr-2" />
                {t('Continuer', 'Continue', 'Continuar').primary}
              </Button>
            </div>
          </div>
        )}

        {/* Reflection Content */}
        {reflectionData && !isLoading && (
          <>
            {/* Acknowledgment — AI uses primary color */}
            <div className="mb-6 p-5 bg-primary/5 rounded-xl border border-primary/15">
              <p className="text-primary leading-relaxed font-medium">
                {reflectionData.reflection}
              </p>
            </div>

            {/* Self-compassion practice — defaults open if the emotion is heavy */}
            {isStruggling(emotions) && (
              <div className="mb-6">
                <SelfCompassionPractice lang={targetLang} defaultOpen />
              </div>
            )}

            {/* Curious Question — revealed after delay */}
            {showQuestion && (
              <div className="animate-fade-in-up">
                <div className="mb-8 space-y-3">
                  <h2 className="font-serif text-xl md:text-2xl text-foreground leading-relaxed">
                    {reflectionData.question}
                  </h2>
                </div>

                {/* Optional Response */}
                <div className="flex-1">
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder={t('Prenez votre temps...', 'Take your time...', 'Tómate tu tiempo...').primary}
                    className="min-h-[120px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
                  />
                  <p className="text-muted-foreground text-xs mt-2">
                    {t("C'est optionnel. Passez si vous préférez.", 'This is optional. Skip if you prefer.', 'Es opcional. Omite si prefieres.').primary}
                  </p>
                </div>

                {/* Choice: Continue exploring or move to gratitude */}
                <div className="mt-8">
              {isLastCycle ? (
                <div className="space-y-3">
                  <p className="text-center text-muted-foreground text-sm mb-4">
                    {isFr ? "Vous avez beaucoup exploré. Terminons avec de la gratitude." : isEs ? "Has explorado mucho. Terminemos con gratitud." : "You've explored a lot. Let's finish with gratitude."}
                    <br />
                    <span className="text-xs">
                      {isFr ? "You've explored a lot. Let's finish with gratitude." : isEs ? "You've explored a lot. Let's finish with gratitude." : "Vous avez beaucoup exploré. Terminons avec de la gratitude."}
                    </span>
                  </p>
                  <Button variant="default" size="full" onClick={handleMoveToGratitude}>
                    <Heart className="w-5 h-5 mr-2" />
                    {bilingual('Terminer avec la gratitude', 'Finish with gratitude', 'Terminar con gratitud')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-foreground font-medium">
                    {isFr ? 'Souhaitez-vous continuer à explorer ?' : isEs ? '¿Deseas continuar explorando?' : 'Would you like to continue exploring?'}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {isFr ? 'Would you like to continue exploring?' : isEs ? 'Would you like to continue exploring?' : 'Souhaitez-vous continuer à explorer ?'}
                    </span>
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-col h-auto py-4 gap-2"
                      onClick={handleContinueExploring}
                    >
                      <ArrowRight className="w-5 h-5" />
                      <span className="text-sm">{isFr ? 'Oui, explorer plus' : isEs ? 'Sí, explorar más' : 'Yes, explore more'}</span>
                      <span className="text-xs text-muted-foreground">{isFr ? 'Yes, explore more' : isEs ? 'Yes, explore more' : 'Oui, explorer plus'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-col h-auto py-4 gap-2"
                      onClick={handleMoveToGratitude}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">{isFr ? 'Non, gratitude' : isEs ? 'No, gratitud' : 'No, gratitude'}</span>
                      <span className="text-xs text-muted-foreground">{isFr ? 'No, move to gratitude' : isEs ? 'No, pasar a la gratitud' : 'Non, passer à la gratitude'}</span>
                    </Button>
                  </div>
                </div>
              )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
