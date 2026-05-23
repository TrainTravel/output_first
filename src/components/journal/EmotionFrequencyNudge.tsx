import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOverUsedVagueWord, dismissWord } from '@/hooks/useFrequencyMirror';

interface EmotionFrequencyNudgeProps {
  onOpenVocabulary: () => void;
}

/**
 * Surfaces a soft "you've used this vague emotion a lot this month" mirror
 * card to nudge users toward higher emotional granularity over time.
 *
 * - Pulls counts from useEmotionVocab's existing storage (no new tracking).
 * - Dismissal stores the word + ISO date; word stays suppressed for 14 days.
 * - Renders nothing if no word currently qualifies.
 */
export function EmotionFrequencyNudge({ onOpenVocabulary }: EmotionFrequencyNudgeProps) {
  const { t } = useLanguage();
  const [pick, setPick] = useState(() => getOverUsedVagueWord());

  if (!pick) return null;

  const { word, count } = pick;

  const handleDismiss = () => {
    dismissWord(word);
    setPick(null);
  };

  return (
    <div
      data-testid="freq-mirror-nudge"
      className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 animate-fade-in-up"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm text-foreground leading-relaxed">
            {t(
              { fr: `Vous vous êtes décrit·e comme « ${word} » ${count} fois ce mois-ci.`, en: `You've named yourself "${word}" ${count} times this month.`, es: `Te has descrito como "${word}" ${count} veces este mes.` },
            ).primary}
          </p>
          <p className="text-xs text-muted-foreground italic">
            {t(
              { fr: 'Un mot plus précis pourrait aider.', en: 'A more precise word might help.', es: 'Una palabra más precisa podría ayudar.' },
            ).primary}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          data-testid="freq-mirror-dismiss"
          aria-label={t({ fr: 'Ignorer', en: 'Dismiss', es: 'Descartar' }).primary}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={onOpenVocabulary}
          data-testid="freq-mirror-alternatives"
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {t({ fr: 'Voir des alternatives', en: 'See alternatives', es: 'Ver alternativas' }).primary} →
        </button>
      </div>
    </div>
  );
}
