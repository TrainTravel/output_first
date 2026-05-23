import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type GardenTheme = 'default' | 'provence' | 'zen' | 'northern' | 'denim' | 'solar' | 'sakura' | 'forest' | 'moonstone' | 'seaglass';

export interface GardenThemeInfo {
  id: GardenTheme;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  preview: { primary: string; accent: string; bg: string };
}

export const GARDEN_THEMES: GardenThemeInfo[] = [
  {
    id: 'default',
    name: 'Default Garden',
    nameFr: 'Jardin par défaut',
    description: 'Sage green & terracotta',
    descriptionFr: 'Vert sauge & terre cuite',
    preview: { primary: 'hsl(145 25% 45%)', accent: 'hsl(18 50% 60%)', bg: 'hsl(40 30% 97%)' },
  },
  {
    id: 'provence',
    name: 'Provence Garden',
    nameFr: 'Jardin de Provence',
    description: 'Lavender fields & warm gold',
    descriptionFr: 'Champs de lavande & or chaud',
    preview: { primary: 'hsl(270 35% 55%)', accent: 'hsl(42 60% 55%)', bg: 'hsl(270 20% 96%)' },
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    nameFr: 'Jardin zen',
    description: 'Stone grey & moss green',
    descriptionFr: 'Gris pierre & vert mousse',
    preview: { primary: 'hsl(90 15% 42%)', accent: 'hsl(40 12% 50%)', bg: 'hsl(60 8% 95%)' },
  },
  {
    id: 'northern',
    name: 'Northern Lights',
    nameFr: 'Aurores boréales',
    description: 'Deep blue & aurora purple',
    descriptionFr: 'Bleu profond & violet aurore',
    preview: { primary: 'hsl(210 50% 50%)', accent: 'hsl(280 40% 58%)', bg: 'hsl(220 25% 96%)' },
  },
  {
    id: 'denim',
    name: 'Denim Sky',
    nameFr: 'Ciel denim',
    description: 'Slate blue & soft cloud',
    descriptionFr: 'Bleu ardoise & nuage doux',
    preview: { primary: 'hsl(215 28% 52%)', accent: 'hsl(200 18% 62%)', bg: 'hsl(215 20% 96%)' },
  },
  {
    id: 'solar',
    name: 'Solar',
    nameFr: 'Solaire',
    description: 'Warm amber & burnt sienna',
    descriptionFr: 'Ambre chaud & terre de Sienne',
    preview: { primary: 'hsl(32 65% 50%)', accent: 'hsl(12 55% 52%)', bg: 'hsl(38 35% 96%)' },
  },
];

interface GardenThemeContextType {
  theme: GardenTheme;
  setTheme: (theme: GardenTheme) => void;
  themeInfo: GardenThemeInfo;
  allThemes: GardenThemeInfo[];
}

const GardenThemeContext = createContext<GardenThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'outputfirst_garden_theme';

export function GardenThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GardenTheme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as GardenTheme) || 'default';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove('theme-provence', 'theme-zen', 'theme-northern', 'theme-denim', 'theme-solar');
    // Apply new theme class (default has no class)
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const setTheme = (t: GardenTheme) => setThemeState(t);

  const themeInfo = GARDEN_THEMES.find(t => t.id === theme) || GARDEN_THEMES[0];

  return (
    <GardenThemeContext.Provider value={{ theme, setTheme, themeInfo, allThemes: GARDEN_THEMES }}>
      {children}
    </GardenThemeContext.Provider>
  );
}

export function useGardenTheme() {
  const context = useContext(GardenThemeContext);
  if (!context) throw new Error('useGardenTheme must be used within GardenThemeProvider');
  return context;
}
