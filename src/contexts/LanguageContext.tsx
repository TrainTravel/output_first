import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'en';

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
  /** Returns primary then secondary text based on current language */
  t: (fr: string, en: string) => { primary: string; secondary: string };
  /** Returns the bilingual string "Primary / Secondary" */
  bilingual: (fr: string, en: string) => string;
  isFr: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'outputfirst_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'en' || stored === 'fr') ? stored : 'fr';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const toggleLanguage = () => setLang(prev => prev === 'fr' ? 'en' : 'fr');

  const isFr = lang === 'fr';

  const t = (fr: string, en: string) => ({
    primary: isFr ? fr : en,
    secondary: isFr ? en : fr,
  });

  const bilingual = (fr: string, en: string) => {
    return isFr ? `${fr} / ${en}` : `${en} / ${fr}`;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t, bilingual, isFr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
