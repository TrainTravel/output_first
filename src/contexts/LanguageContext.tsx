import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'es' | 'zh-Hans' | 'zh-Hant';

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
  /** Returns primary then secondary text based on current language.
   *  Chinese params are optional — falls back to English when omitted. */
  t: (fr: string, en: string, es: string, zhHans?: string, zhHant?: string) => { primary: string; secondary: string };
  /** Returns the bilingual string "Primary / Secondary" */
  bilingual: (fr: string, en: string, es: string, zhHans?: string, zhHant?: string) => string;
  isFr: boolean;
  isEs: boolean;
  isZh: boolean;
  /** True when the active language is any Chinese variant */
  zhVariant: 'Hans' | 'Hant' | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'outputfirst_language';

const LANG_CYCLE: Language[] = ['fr', 'en', 'es', 'zh-Hans', 'zh-Hant'];

function isValidLang(v: string | null): v is Language {
  return v === 'fr' || v === 'en' || v === 'es' || v === 'zh-Hans' || v === 'zh-Hant';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidLang(stored) ? stored : 'fr';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const toggleLanguage = () =>
    setLang(prev => {
      const idx = LANG_CYCLE.indexOf(prev);
      return LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
    });

  const isFr = lang === 'fr';
  const isEs = lang === 'es';
  const isZh = lang === 'zh-Hans' || lang === 'zh-Hant';
  const zhVariant = lang === 'zh-Hans' ? 'Hans' : lang === 'zh-Hant' ? 'Hant' : null;

  const t = (fr: string, en: string, es: string, zhHans?: string, zhHant?: string) => {
    let primary: string;
    let secondary: string;

    switch (lang) {
      case 'fr':
        primary = fr;
        secondary = en;
        break;
      case 'es':
        primary = es;
        secondary = en;
        break;
      case 'zh-Hans':
        primary = zhHans || en;
        secondary = en;
        break;
      case 'zh-Hant':
        primary = zhHant || en;
        secondary = en;
        break;
      default: // 'en'
        primary = en;
        secondary = fr;
        break;
    }

    return { primary, secondary };
  };

  const bilingual = (fr: string, en: string, es: string, zhHans?: string, zhHant?: string) => {
    switch (lang) {
      case 'fr': return `${fr} / ${en}`;
      case 'es': return `${es} / ${en}`;
      // Chinese MVP is for native-English learners — never mix French in.
      case 'zh-Hans': return zhHans ? `${zhHans} / ${en}` : en;
      case 'zh-Hant': return zhHant ? `${zhHant} / ${en}` : en;
      default: return `${en} / ${fr}`;
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t, bilingual, isFr, isEs, isZh, zhVariant }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
