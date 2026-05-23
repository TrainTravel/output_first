import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type FontKey = 'default' | 'lexend' | 'atkinson' | 'mono' | 'opendyslexic';

export interface FontOption {
  id: FontKey;
  label: string;
  cssFamily: string; // value applied to --font-body
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'default', label: 'Default', cssFamily: "'DM Sans', sans-serif" },
  { id: 'lexend', label: 'Lexend', cssFamily: "'Lexend', sans-serif" },
  { id: 'atkinson', label: 'Atkinson', cssFamily: "'Atkinson Hyperlegible', sans-serif" },
  { id: 'mono', label: 'Mono', cssFamily: "'JetBrains Mono', ui-monospace, monospace" },
  { id: 'opendyslexic', label: 'OpenD.', cssFamily: "'OpenDyslexic', sans-serif" },
];

const STORAGE_KEY = 'outputfirst_font_pref';
const VALID = new Set<FontKey>(FONT_OPTIONS.map((f) => f.id));

interface FontContextType {
  font: FontKey;
  setFont: (f: FontKey) => void;
  options: FontOption[];
}

const FontContext = createContext<FontContextType | undefined>(undefined);

function readStored(): FontKey {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID.has(raw as FontKey)) return raw as FontKey;
  } catch {
    /* ignore */
  }
  return 'default';
}

export function FontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<FontKey>(readStored);

  useEffect(() => {
    const opt = FONT_OPTIONS.find((o) => o.id === font) ?? FONT_OPTIONS[0];
    document.documentElement.style.setProperty('--font-body', opt.cssFamily);
    try {
      localStorage.setItem(STORAGE_KEY, font);
    } catch {
      /* ignore */
    }
  }, [font]);

  const setFont = (f: FontKey) => setFontState(VALID.has(f) ? f : 'default');

  return (
    <FontContext.Provider value={{ font, setFont, options: FONT_OPTIONS }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error('useFont must be used within FontProvider');
  return ctx;
}
