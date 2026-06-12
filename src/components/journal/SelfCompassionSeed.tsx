import { useState } from 'react';
import { X, Leaf } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDailyStep, getDailyPhrase, isSeedDismissedToday, dismissSeedToday } from '@/hooks/useSelfCompassion';
import type { Language } from '@/contexts/LanguageContext';

const STEP_FR = ['Présence consciente', 'Humanité partagée', 'Bienveillance envers soi'] as const;
const STEP_EN = ['Mindfulness', 'Common humanity', 'Self-kindness'] as const;
const STEP_ES = ['Presencia consciente', 'Humanidad compartida', 'Bondad hacia uno mismo'] as const;
const STEP_JA = ['今この瞬間に気づく', '共通の人間性', '自分にやさしく'] as const;
const STEP_ZH_HANS = ['正念', '共通的人性', '善待自己'] as const;
const STEP_ZH_HANT = ['正念', '共通的人性', '善待自己'] as const;

interface SelfCompassionSeedProps {
  lang: Language;
}

export function SelfCompassionSeed({ lang }: SelfCompassionSeedProps) {
  const [dismissed, setDismissed] = useState(() => isSeedDismissedToday());
  const { bilingual } = useLanguage();

  if (dismissed) return null;

  const step = getDailyStep();
  const phrase = getDailyPhrase(step, lang);
  const bilingualLabel = bilingual({
    fr: STEP_FR[step],
    en: STEP_EN[step],
    es: STEP_ES[step],
    ja: STEP_JA[step],
    'zh-Hans': STEP_ZH_HANS[step],
    'zh-Hant': STEP_ZH_HANT[step],
  });

  const handleDismiss = () => {
    dismissSeedToday();
    setDismissed(true);
  };

  return (
    <div
      data-testid="compassion-seed"
      className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 animate-fade-in-up"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Leaf className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{bilingualLabel}</span>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="font-serif text-base italic text-foreground mt-2 leading-relaxed">
        {phrase}
      </p>
    </div>
  );
}
