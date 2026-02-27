import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EMOTION_SUGGESTIONS, EmotionWord } from '@/types/journal';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const MAX_EMOTIONS = 3;

interface EmotionsScreenProps {
  onSave: (emotion?: string, emotionFr?: string) => void;
  onBack: () => void;
}

export function EmotionsScreen({ onSave, onBack }: EmotionsScreenProps) {
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionWord[]>([]);
  const { t, isFr, isEs } = useLanguage();

  const toggleEmotion = (emotion: EmotionWord) => {
    const isSelected = selectedEmotions.some(e => e.en === emotion.en);
    if (isSelected) {
      setSelectedEmotions(selectedEmotions.filter(e => e.en !== emotion.en));
    } else if (selectedEmotions.length < MAX_EMOTIONS) {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const handleContinue = () => {
    if (selectedEmotions.length === 0) {
      onSave(undefined, undefined);
    } else {
      const emotionsEn = selectedEmotions.map(e => e.en).join(', ');
      const emotionsFr = selectedEmotions.map(e => e.fr).join(', ');
      onSave(emotionsEn, emotionsFr);
    }
  };

  const handleSkip = () => {
    onSave(undefined, undefined);
  };

  const header = t('Un mot pour ce que vous ressentez', 'A word for how you feel', 'Una palabra para lo que sientes');

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
        <div className="mb-8 space-y-3">
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

        {/* Emotion Groups */}
        <div className="flex-1 space-y-6">
          {EMOTION_SUGGESTIONS.map((group) => (
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
                  return (
                    <button
                      key={emotion.en}
                      onClick={() => toggleEmotion(emotion)}
                      disabled={isDisabled}
                      className={`
                        px-4 py-2 rounded-full text-sm transition-all duration-200
                        ${isSelected
                          ? 'bg-primary text-primary-foreground shadow-gentle'
                          : isDisabled
                            ? 'bg-muted/50 border border-border/50 text-muted-foreground cursor-not-allowed'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                        }
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
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

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
