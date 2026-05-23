import { useLanguage } from '@/contexts/LanguageContext';
import type { PrimaryLang } from '@/contexts/LanguageContext';
import { Settings } from 'lucide-react';

const LABELS: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
  'zh-Hans': '简',
  'zh-Hant': '繁',
};

const VERBS: Record<PrimaryLang, { speak: string; learn: string }> = {
  en: { speak: 'speak', learn: 'learn' },
  fr: { speak: 'parle', learn: 'apprend' },
  es: { speak: 'hablo', learn: 'aprendo' },
};

const ARIA: Record<PrimaryLang, (p: string, t: string) => string> = {
  en: (p, t) => `Speaking ${p}, learning ${t}. Tap to switch.`,
  fr: (p, t) => `Parle ${p}, apprend ${t}. Touche pour changer.`,
  es: (p, t) => `Hablo ${p}, aprendo ${t}. Toca para cambiar.`,
};

interface LanguageToggleProps {
  onOpenSettings?: () => void;
}

export function LanguageToggle({ onOpenSettings }: LanguageToggleProps = {}) {
  const { primaryLang, targetLang, toggleLanguage } = useLanguage();
  const verbs = VERBS[primaryLang] ?? VERBS.en;
  const ariaBuilder = ARIA[primaryLang] ?? ARIA.en;
  const pair = `${verbs.speak} ${LABELS[primaryLang]} · ${verbs.learn} ${LABELS[targetLang]}`;
  const aria = ariaBuilder(LABELS[primaryLang], LABELS[targetLang]);

  return (
    <div className="inline-flex items-center gap-1">
      <div className="group relative">
        <button
          onClick={toggleLanguage}
          aria-label={aria}
          title={pair}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-sm font-semibold leading-none">{LABELS[targetLang]}</span>
          <span className="text-[10px] leading-none mt-1 text-muted-foreground/70">{LABELS[primaryLang]}</span>
        </button>
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {pair}
        </div>
      </div>
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Language settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
