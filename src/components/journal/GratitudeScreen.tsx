import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check } from 'lucide-react';
import { BilingualPrompt } from '@/types/journal';
import { useLanguage } from '@/contexts/LanguageContext';

interface GratitudeScreenProps {
  prompt: BilingualPrompt;
  onSave: (gratitude?: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function GratitudeScreen({ prompt, onSave, onSkip, onBack }: GratitudeScreenProps) {
  const [gratitude, setGratitude] = useState('');
  const { t } = useLanguage();

  const handleSave = () => {
    onSave(gratitude.trim() || undefined);
  };

  const promptText = t(prompt.fr, prompt.en, prompt.en);

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
          <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed">
            {promptText.primary}
          </h2>
          <p className="text-muted-foreground italic">
            {promptText.secondary}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            {t("C'est optionnel. Passez si rien ne vous vient.", 'This is optional. Skip if nothing comes to mind.', 'Es opcional. Omite si no se te ocurre nada.').primary}
          </p>
        </div>

        {/* Text Area */}
        <div className="flex-1">
          <Textarea
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder={t('Quelque chose de petit suffit...', 'Something small is perfect...', 'Algo pequeño es suficiente...').primary}
            className="min-h-[150px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
          />
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Button variant="default" size="full" onClick={handleSave}>
            <Check className="w-5 h-5 mr-2" />
            {t('Terminer le journal', 'Complete journal', 'Terminar el diario').primary}
          </Button>

          <Button variant="skip" size="full" onClick={onSkip}>
            {t('Passer et terminer', 'Skip and finish', 'Omitir y terminar').primary}
          </Button>
        </div>
      </div>
    </div>
  );
}
