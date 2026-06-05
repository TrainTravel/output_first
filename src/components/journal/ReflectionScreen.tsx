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
            <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
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
              {t({ fr: 'Prenant un moment pour réfléchir...', en: 'Taking a moment to reflect...', es: 'Tomando un momento para reflexionar...', ja: '少し考えています...', 'zh-Hans': '稍等，正在思考...', 'zh-Hant': '稍等，正在思考...' }).primary}
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
                {t({ fr: 'Continuer', en: 'Continue', es: 'Continuar', ja: '続ける', 'zh-Hans': '继续', 'zh-Hant': '繼續' }).primary}
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
                    placeholder={t({ fr: 'Prenez votre temps...', en: 'Take your time...', es: 'Tómate tu tiempo...', ja: 'ゆっくりどうぞ...', 'zh-Hans': '慢慢来...', 'zh-Hant': '慢慢來...' }).primary}
                    className="min-h-[120px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
                  />
                  <p className="text-muted-foreground text-xs mt-2">
                    {t({ fr: "C'est optionnel. Passez si vous préférez.", en: 'This is optional. Skip if you prefer.', es: 'Es opcional. Omite si prefieres.', ja: '任意です。スキップしてもかまいません。', 'zh-Hans': '这是可选的，可以跳过。', 'zh-Hant': '這是選填的，可以跳過。' }).primary}
                  </p>
                </div>

                {/* Choice: Continue exploring or move to gratitude */}
                <div className="mt-8">
              {isLastCycle ? (
                <div className="space-y-3">
                  <p className="text-center text-muted-foreground text-sm mb-4">
                    {t({ fr: "Vous avez beaucoup exploré. Terminons avec de la gratitude.", en: "You've explored a lot. Let's finish with gratitude.", es: "Has explorado mucho. Terminemos con gratitud.", ja: 'たくさん探求(たんきゅう)しましたね。感謝(かんしゃ)で締(し)めくくりましょう。', 'zh-Hans': '你已经探索了不少。让我们以感恩收尾吧。', 'zh-Hant': '你已經探索了不少。讓我們以感恩收尾吧。' }).primary}
                    <br />
                    <span className="text-xs">
                      {t({ fr: "Vous avez beaucoup exploré. Terminons avec de la gratitude.", en: "You've explored a lot. Let's finish with gratitude.", es: "Has explorado mucho. Terminemos con gratitud.", ja: 'たくさん探求(たんきゅう)しましたね。感謝(かんしゃ)で締(し)めくくりましょう。', 'zh-Hans': '你已经探索了不少。让我们以感恩收尾吧。', 'zh-Hant': '你已經探索了不少。讓我們以感恩收尾吧。' }).secondary}
                    </span>
                  </p>
                  <Button variant="default" size="full" onClick={handleMoveToGratitude}>
                    <Heart className="w-5 h-5 mr-2" />
                    {bilingual({ fr: 'Terminer avec la gratitude', en: 'Finish with gratitude', es: 'Terminar con gratitud', ja: '感謝で締めくくる', 'zh-Hans': '以感恩收尾', 'zh-Hant': '以感恩收尾' })}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-foreground font-medium">
                    {t({ fr: 'Souhaitez-vous continuer à explorer ?', en: 'Would you like to continue exploring?', es: '¿Deseas continuar explorando?', ja: 'もう少(すこ)し探求(たんきゅう)を続(つづ)けますか？', 'zh-Hans': '想再继续探索一下吗？', 'zh-Hant': '想再繼續探索一下嗎？' }).primary}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {t({ fr: 'Souhaitez-vous continuer à explorer ?', en: 'Would you like to continue exploring?', es: '¿Deseas continuar explorando?', ja: 'もう少(すこ)し探求(たんきゅう)を続(つづ)けますか？', 'zh-Hans': '想再继续探索一下吗？', 'zh-Hant': '想再繼續探索一下嗎？' }).secondary}
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
                      <span className="text-sm">{t({ fr: 'Oui, explorer plus', en: 'Yes, explore more', es: 'Sí, explorar más', ja: 'はい、もう少(すこ)し続(つづ)けます', 'zh-Hans': '好，继续探索', 'zh-Hant': '好，繼續探索' }).primary}</span>
                      <span className="text-xs text-muted-foreground">{t({ fr: 'Oui, explorer plus', en: 'Yes, explore more', es: 'Sí, explorar más', ja: 'はい、もう少(すこ)し続(つづ)けます', 'zh-Hans': '好，继续探索', 'zh-Hant': '好，繼續探索' }).secondary}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-col h-auto py-4 gap-2"
                      onClick={handleMoveToGratitude}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">{t({ fr: 'Non, gratitude', en: 'No, gratitude', es: 'No, gratitud', ja: 'いいえ、感謝(かんしゃ)へ', 'zh-Hans': '不，去感恩', 'zh-Hant': '不，去感恩' }).primary}</span>
                      <span className="text-xs text-muted-foreground">{t({ fr: 'Non, passer à la gratitude', en: 'No, move to gratitude', es: 'No, pasar a la gratitud', ja: 'いいえ、感謝(かんしゃ)に進(すす)みます', 'zh-Hans': '不，转向感恩', 'zh-Hant': '不，轉向感恩' }).secondary}</span>
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
