import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LABELS: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
  'zh-Hans': '简',
  'zh-Hant': '繁',
};

export function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5" />
      {LABELS[lang] ?? 'EN'}
    </button>
  );
}
