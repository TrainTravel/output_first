import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EMOTION_SUGGESTIONS, EmotionWord } from '@/types/journal';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface EmotionsScreenProps {
  onSave: (emotion?: string, emotionFr?: string) => void;
  onBack: () => void;
}

export function EmotionsScreen({ onSave, onBack }: EmotionsScreenProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionWord | null>(null);

  const handleContinue = () => {
    onSave(selectedEmotion?.en, selectedEmotion?.fr);
  };

  const handleSkip = () => {
    onSave(undefined, undefined);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">Retour / Back</span>
        </button>

        {/* Header */}
        <div className="mb-8 space-y-3">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground">
            Un mot pour ce que vous ressentez
          </h2>
          <p className="text-muted-foreground italic">
            A word for how you feel
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Choisissez un mot qui décrit votre état. / Choose a word that describes your state.
          </p>
        </div>

        {/* Emotion Groups */}
        <div className="flex-1 space-y-6">
          {EMOTION_SUGGESTIONS.map((group) => (
            <div key={group.category} className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium tracking-wide">
                {group.categoryFr} <span className="text-muted-foreground/60">/ {group.category}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {group.emotions.map((emotion) => (
                  <button
                    key={emotion.en}
                    onClick={() => setSelectedEmotion(
                      selectedEmotion?.en === emotion.en ? null : emotion
                    )}
                    className={`
                      px-4 py-2 rounded-full text-sm transition-all duration-200
                      ${selectedEmotion?.en === emotion.en
                        ? 'bg-primary text-primary-foreground shadow-gentle'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <span className="font-medium">{emotion.fr}</span>
                    <span className="text-xs opacity-70 ml-1">({emotion.en})</span>
                  </button>
                ))}
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
            Continuer / Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button
            variant="skip"
            size="full"
            onClick={handleSkip}
          >
            Passer cette étape / Skip this step
          </Button>
        </div>
      </div>
    </div>
  );
}
