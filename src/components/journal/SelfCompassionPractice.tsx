import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDailyStep, getDailyPhrase, getDailyStepLabel } from '@/hooks/useSelfCompassion';
import type { NeffStep } from '@/data/compassionPhrases';
import type { Language } from '@/contexts/LanguageContext';

interface SelfCompassionPracticeProps {
  lang: Language;
  defaultOpen?: boolean;
}

const STEP_FR = ['Présence consciente', 'Humanité partagée', 'Bienveillance envers soi'] as const;
const STEP_EN = ['Mindfulness', 'Common humanity', 'Self-kindness'] as const;
const STEP_ES = ['Presencia consciente', 'Humanidad compartida', 'Bondad hacia uno mismo'] as const;

export function SelfCompassionPractice({ lang, defaultOpen = false }: SelfCompassionPracticeProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [activeStep, setActiveStep] = useState<NeffStep>(() => getDailyStep());
  const { bilingual, t } = useLanguage();

  const phrase = getDailyPhrase(activeStep, lang);
  const stepLabel = getDailyStepLabel(activeStep, lang);
  const triggerLabel = bilingual(
    'Moment de bienveillance',
    'Self-compassion',
    'Momento de bondad',
  );

  const prevStep = () => setActiveStep(s => ((s + 2) % 3) as NeffStep);
  const nextStep = () => setActiveStep(s => ((s + 1) % 3) as NeffStep);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        data-testid="compassion-practice"
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-primary/15 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground font-medium">{triggerLabel}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div
          data-testid="compassion-practice-content"
          className="mt-2 px-4 py-4 rounded-xl border border-primary/10 bg-primary/3 space-y-4"
        >
          {/* Step dots */}
          <div className="flex items-center gap-1.5 justify-center">
            {([0, 1, 2] as NeffStep[]).map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === activeStep ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Step label */}
          <p className="text-xs text-muted-foreground text-center font-medium tracking-wide">
            {stepLabel}
          </p>

          {/* Phrase */}
          <p className="font-serif text-sm italic text-foreground leading-relaxed text-center">
            {phrase}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              onClick={prevStep}
              aria-label={t('Étape précédente', 'Previous step', 'Paso anterior').primary}
              className="p-1 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              {t(
                `Étape ${activeStep + 1} sur 3`,
                `Step ${activeStep + 1} of 3`,
                `Paso ${activeStep + 1} de 3`,
              ).primary}
            </span>
            <button
              onClick={nextStep}
              aria-label={t('Étape suivante', 'Next step', 'Paso siguiente').primary}
              className="p-1 hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
