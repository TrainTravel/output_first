import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'es';

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
  /** Returns primary then secondary text based on current language */
  t: (fr: string, en: string, es: string) => { primary: string; secondary: string };
  /** Returns the bilingual string "Primary / Secondary" */
  bilingual: (fr: string, en: string, es: string) => string;
  isFr: boolean;
  isEs: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'outputfirst_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'en' || stored === 'fr' || stored === 'es') ? stored : 'fr';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const toggleLanguage = () => setLang(prev => prev === 'fr' ? 'en' : prev === 'en' ? 'es' : 'fr');

  const isFr = lang === 'fr';
  const isEs = lang === 'es';

  const t = (fr: string, en: string, es: string) => ({
    primary: lang === 'fr' ? fr : lang === 'es' ? es : en,
    secondary: lang === 'en' ? fr : en,
  });

  const bilingual = (fr: string, en: string, es: string) => {
    return lang === 'fr' ? `${fr} / ${en}` : lang === 'es' ? `${es} / ${en}` : `${en} / ${fr}`;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t, bilingual, isFr, isEs }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
