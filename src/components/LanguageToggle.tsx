import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Settings } from 'lucide-react';

const LABELS: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
  'zh-Hans': '简',
  'zh-Hant': '繁',
};

interface LanguageToggleProps {
  /** Optional callback to open the full settings screen (e.g. gear icon). */
  onOpenSettings?: () => void;
}

/**
 * Cheap one-tap flip of primaryLang. Long-press (or the small gear) opens
 * the full pair settings — kept reachable, but not the default action.
 */
export function LanguageToggle({ onOpenSettings }: LanguageToggleProps = {}) {
  const { primaryLang, targetLang, toggleLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={toggleLanguage}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
        aria-label="Toggle primary language"
        title={`${LABELS[primaryLang]} → ${LABELS[targetLang]}`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{LABELS[primaryLang]} → {LABELS[targetLang]}</span>
      </button>
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
