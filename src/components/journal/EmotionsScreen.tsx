import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { EmotionWord } from '@/types/journal';
import { ArrowRight, ArrowLeft, Sprout } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEmotionVocab } from '@/hooks/useEmotionVocab';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MAX_EMOTIONS = 3;

interface EmotionsScreenProps {
  onSave: (emotion?: string, emotionFr?: string) => void;
  onBack: () => void;
}

export function EmotionsScreen({ onSave, onBack }: EmotionsScreenProps) {
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionWord[]>([]);
  const { t, isFr, isEs } = useLanguage();
  const { getSessionWords, markEncountered, markUsed, isFirstEncounter, stats } = useEmotionVocab();

  const sessionWords = useMemo(() => getSessionWords(), [getSessionWords]);

  // Mark words as encountered on mount
  useEffect(() => {
    const allWords = sessionWords.flatMap(g => g.emotions);
    markEncountered(allWords);
  }, [sessionWords, markEncountered]);

  const toggleEmotion = (emotion: EmotionWord) => {
    const isSelected = selectedEmotions.some(e => e.en === emotion.en);
    if (isSelected) {
      setSelectedEmotions(selectedEmotions.filter(e => e.en !== emotion.en));
    } else if (selectedEmotions.length < MAX_EMOTIONS) {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const handleContinue = () => {
    if (selectedEmotions.length > 0) {
      markUsed(selectedEmotions);
      const emotionsEn = selectedEmotions.map(e => e.en).join(', ');
      const emotionsFr = selectedEmotions.map(e => e.fr).join(', ');
      onSave(emotionsEn, emotionsFr);
    } else {
      onSave(undefined, undefined);
    }
  };

  const handleSkip = () => {
    onSave(undefined, undefined);
  };

  const header = t('Un mot pour ce que vous ressentez', 'A word for how you feel', 'Una palabra para lo que sientes');
  const growthPercent = stats.totalAvailable > 0 ? Math.round((stats.totalEncountered / stats.totalAvailable) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t('Retour', 'Back', 'Volver').primary}</span>
        </button>

        {/* Header */}
        <div className="mb-6 space-y-3">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground">
            {header.primary}
          </h2>
          <p className="text-muted-foreground italic">
            {header.secondary}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            {t(`Choisissez jusqu'à ${MAX_EMOTIONS} mots.`, `Choose up to ${MAX_EMOTIONS} words.`, `Elige hasta ${MAX_EMOTIONS} palabras.`).primary}
            {selectedEmotions.length > 0 && (
              <span className="ml-2 text-primary">({selectedEmotions.length}/{MAX_EMOTIONS})</span>
            )}
          </p>
        </div>

        {/* Vocabulary Growth Badge */}
        <div className="mb-6 bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Sprout className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              {t('Vocabulaire exploré', 'Words explored', 'Vocabulario explorado').primary}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={growthPercent} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                {stats.totalEncountered} / {stats.totalAvailable}
              </span>
            </div>
          </div>
        </div>

        {/* Emotion Groups */}
        <TooltipProvider delayDuration={300}>
          <div className="flex-1 space-y-6">
            {sessionWords.map((group) => (
              <div key={group.category} className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  {isFr ? (
                    <>{group.categoryFr} <span className="text-muted-foreground/60">/ {group.category}</span></>
                  ) : isEs ? (
                    <>{group.categoryEs} <span className="text-muted-foreground/60">/ {group.category}</span></>
                  ) : (
                    <>{group.category} <span className="text-muted-foreground/60">/ {group.categoryFr}</span></>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.emotions.map((emotion) => {
                    const isSelected = selectedEmotions.some(e => e.en === emotion.en);
                    const isDisabled = !isSelected && selectedEmotions.length >= MAX_EMOTIONS;
                    const isNew = isFirstEncounter(emotion);

                    const button = (
                      <button
                        key={emotion.en}
                        onClick={() => toggleEmotion(emotion)}
                        disabled={isDisabled}
                        className={`
                          px-4 py-2 rounded-full text-sm transition-all duration-200 relative
                          ${isSelected
                            ? 'bg-primary text-primary-foreground shadow-gentle'
                            : isDisabled
                              ? 'bg-muted/50 border border-border/50 text-muted-foreground cursor-not-allowed'
                              : 'bg-card border border-border text-foreground hover:bg-muted'
                          }
                          ${isNew && !isSelected ? 'ring-1 ring-primary/30' : ''}
                        `}
                      >
                        {isFr ? (
                          <>
                            <span className="font-medium">{emotion.fr}</span>
                            <span className="text-xs opacity-70 ml-1">({emotion.en})</span>
                          </>
                        ) : isEs ? (
                          <>
                            <span className="font-medium">{emotion.es}</span>
                            <span className="text-xs opacity-70 ml-1">({emotion.en})</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium">{emotion.en}</span>
                            <span className="text-xs opacity-70 ml-1">({emotion.fr})</span>
                          </>
                        )}
                        {isNew && !isSelected && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                        )}
                      </button>
                    );

                    // Show nuance tooltip for first encounters
                    if (isNew) {
                      return (
                        <Tooltip key={emotion.en}>
                          <TooltipTrigger asChild>
                            {button}
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] text-xs">
                            {emotion.nuance}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return button;
                  })}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Button
            variant="default"
            size="full"
            onClick={handleContinue}
          >
            {t('Continuer', 'Continue', 'Continuar').primary}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <Button
            variant="skip"
            size="full"
            onClick={handleSkip}
          >
            {t('Passer cette étape', 'Skip this step', 'Omitir este paso').primary}
          </Button>
        </div>
      </div>
    </div>
  );
}
