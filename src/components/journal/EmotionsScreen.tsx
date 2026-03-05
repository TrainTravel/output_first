import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { EmotionWord } from '@/types/journal';
import { ArrowRight, ArrowLeft, Sprout, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEmotionVocab } from '@/hooks/useEmotionVocab';
import { Progress } from '@/components/ui/progress';
import { EmotionDetailDrawer } from './EmotionDetailDrawer';

const MAX_EMOTIONS = 3;

interface EmotionsScreenProps {
  onSave: (emotion?: string, emotionFr?: string) => void;
  onBack: () => void;
  onOpenVocabulary?: () => void;
}

export function EmotionsScreen({ onSave, onBack, onOpenVocabulary }: EmotionsScreenProps) {
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionWord[]>([]);
  const [drawerWord, setDrawerWord] = useState<EmotionWord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, isFr, isEs, lang } = useLanguage();
  const { getSessionWords, markEncountered, markUsed, isFirstEncounter, stats } = useEmotionVocab();

  const sessionWords = useMemo(() => getSessionWords(), [getSessionWords]);

  // Mark words as encountered on mount
  useEffect(() => {
    const allWords = sessionWords.flatMap(g => g.emotions);
    markEncountered(allWords);
  }, [sessionWords, markEncountered]);

  const openDrawer = (emotion: EmotionWord) => {
    setDrawerWord(emotion);
    setDrawerOpen(true);
  };

  const handleToggleSelect = (emotion: EmotionWord) => {
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
                  const isAtMax = !isSelected && selectedEmotions.length >= MAX_EMOTIONS;
                  const isNew = isFirstEncounter(emotion);

                  return (
                    <div key={emotion.en} className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleSelect(emotion)}
                        disabled={isAtMax}
                        className={`
                          px-4 py-2 rounded-full text-sm transition-all duration-200 relative
                          ${isSelected
                            ? 'bg-primary text-primary-foreground shadow-gentle'
                            : isAtMax
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
                      <button
                        onClick={() => openDrawer(emotion)}
                        aria-label={`Learn more about ${emotion.en}`}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                          ${isNew && !isSelected ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}
                        `}
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Explore all words link */}
        {onOpenVocabulary && (
          <button
            onClick={onOpenVocabulary}
            className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
          >
            <Sprout className="w-3.5 h-3.5" />
            {t('Explorer les 48 mots', 'Explore all 48 words', 'Explorar las 48 palabras').primary} →
          </button>
        )}

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

      <EmotionDetailDrawer
        word={drawerWord}
        isOpen={drawerOpen}
        isSelected={drawerWord ? selectedEmotions.some(e => e.en === drawerWord.en) : false}
        atMax={selectedEmotions.length >= MAX_EMOTIONS}
        onClose={() => setDrawerOpen(false)}
        onToggleSelect={handleToggleSelect}
        language={lang}
      />
    </div>
  );
}
