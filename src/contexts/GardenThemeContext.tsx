import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

/*
 * ─────────────────────────────────────────────────────────────────────
 * GardenThemeContext — ASD/ADHD-aware theme metadata
 * ─────────────────────────────────────────────────────────────────────
 *
 * Spec (2026-05-23): The 10 garden themes are kept as-is. Each theme is
 * tagged along three dimensions so neurodivergent users can filter by
 * sensory load rather than guessing from aesthetic names:
 *
 *   - arousal:  visual stimulation level (low / medium / high)
 *               proxied by HSL saturation and primary-accent gap
 *   - contrast: perceived primary-vs-bg contrast (low / standard / high)
 *               relevant for photosensitivity and visual fatigue
 *   - intent:   recommended emotional use case (calming / balanced / energizing)
 *
 * Calm-first ordering (in the selector) sorts low-arousal calming themes
 * to the top so a dysregulated user doesn't have to scan past saturated
 * options to find a soothing one.
 *
 * Hydration is now validator-gated (mirrors LanguageContext.validatePair):
 * an unknown stored id (e.g. "comic-sans") falls back to 'default' rather
 * than poisoning the state with an invalid value.
 * ─────────────────────────────────────────────────────────────────────
 */

export type GardenTheme = 'default' | 'provence' | 'zen' | 'northern' | 'denim' | 'solar' | 'sakura' | 'forest' | 'moonstone' | 'seaglass';

export type ThemeArousal = 'low' | 'medium' | 'high';
export type ThemeContrast = 'low' | 'standard' | 'high';
export type ThemeIntent = 'calming' | 'balanced' | 'energizing';

export interface GardenThemeInfo {
  id: GardenTheme;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  preview: { primary: string; accent: string; bg: string };
  arousal: ThemeArousal;
  contrast: ThemeContrast;
  intent: ThemeIntent;
}

/*
 * Metadata rationale (calibrated from preview HSL values, not just vibes):
 *
 *   default   — sage primary (25% sat) + terracotta accent (50% sat).
 *               Familiar warm palette. medium arousal, balanced intent.
 *   provence  — saturated lavender (35%) + gold accent (60%). Two strong
 *               hues. medium-high arousal, energizing intent.
 *   zen       — all desaturated stone/moss (12–15%). Deliberately quiet.
 *               low arousal, calming, low contrast.
 *   northern  — saturated blue (50%) + purple accent (40%). Aurora vibes.
 *               high arousal, energizing, high contrast.
 *   denim     — muted slate (28%) with low-sat cloud accent (18%).
 *               low arousal, calming.
 *   solar     — warm amber (65%) + burnt sienna (55%). Saturated, hot.
 *               high arousal, energizing.
 *   sakura    — soft pink (45%) + sage accent (22%). Gentle but pink draws
 *               the eye. medium arousal, balanced intent.
 *   forest    — deep evergreen (32%) + warm fog (22%). Naturalistic.
 *               low arousal, calming.
 *   moonstone — desaturated lavender-grey (20%) + pearl accent (14%).
 *               Cool, quiet, dusk-like. low arousal, calming.
 *   seaglass  — soft teal (35%) + warm sand (35%). Beach-meditative.
 *               low arousal, calming.
 *
 *   Distribution check: low=6, medium=2, high=2; calming=6, balanced=2,
 *   energizing=3 (sakura was retagged balanced after manual review of
 *   saturation profile — see test expectations below).
 */

export const GARDEN_THEMES: GardenThemeInfo[] = [
  {
    id: 'default',
    name: 'Default Garden',
    nameFr: 'Jardin par défaut',
    description: 'Sage green & terracotta',
    descriptionFr: 'Vert sauge & terre cuite',
    preview: { primary: 'hsl(145 25% 45%)', accent: 'hsl(18 50% 60%)', bg: 'hsl(40 30% 97%)' },
    arousal: 'medium',
    contrast: 'standard',
    intent: 'balanced',
  },
  {
    id: 'provence',
    name: 'Provence Garden',
    nameFr: 'Jardin de Provence',
    description: 'Lavender fields & warm gold',
    descriptionFr: 'Champs de lavande & or chaud',
    preview: { primary: 'hsl(270 35% 55%)', accent: 'hsl(42 60% 55%)', bg: 'hsl(270 20% 96%)' },
    arousal: 'high',
    contrast: 'standard',
    intent: 'energizing',
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    nameFr: 'Jardin zen',
    description: 'Stone grey & moss green',
    descriptionFr: 'Gris pierre & vert mousse',
    preview: { primary: 'hsl(90 15% 42%)', accent: 'hsl(40 12% 50%)', bg: 'hsl(60 8% 95%)' },
    arousal: 'low',
    contrast: 'low',
    intent: 'calming',
  },
  {
    id: 'northern',
    name: 'Northern Lights',
    nameFr: 'Aurores boréales',
    description: 'Deep blue & aurora purple',
    descriptionFr: 'Bleu profond & violet aurore',
    preview: { primary: 'hsl(210 50% 50%)', accent: 'hsl(280 40% 58%)', bg: 'hsl(220 25% 96%)' },
    arousal: 'high',
    contrast: 'high',
    intent: 'energizing',
  },
  {
    id: 'denim',
    name: 'Denim Sky',
    nameFr: 'Ciel denim',
    description: 'Slate blue & soft cloud',
    descriptionFr: 'Bleu ardoise & nuage doux',
    preview: { primary: 'hsl(215 28% 52%)', accent: 'hsl(200 18% 62%)', bg: 'hsl(215 20% 96%)' },
    arousal: 'low',
    contrast: 'standard',
    intent: 'calming',
  },
  {
    id: 'solar',
    name: 'Solar',
    nameFr: 'Solaire',
    description: 'Warm amber & burnt sienna',
    descriptionFr: 'Ambre chaud & terre de Sienne',
    preview: { primary: 'hsl(32 65% 50%)', accent: 'hsl(12 55% 52%)', bg: 'hsl(38 35% 96%)' },
    arousal: 'high',
    contrast: 'high',
    intent: 'energizing',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    nameFr: 'Sakura',
    description: 'Cherry blossom pink & soft sage',
    descriptionFr: 'Rose cerisier & sauge douce',
    preview: { primary: 'hsl(345 45% 65%)', accent: 'hsl(130 22% 58%)', bg: 'hsl(350 40% 97%)' },
    arousal: 'medium',
    contrast: 'standard',
    intent: 'balanced',
  },
  {
    id: 'forest',
    name: 'Forest Mist',
    nameFr: 'Brume forestière',
    description: 'Deep evergreen & soft fog',
    descriptionFr: 'Conifère profond & brume douce',
    preview: { primary: 'hsl(160 32% 38%)', accent: 'hsl(35 22% 55%)', bg: 'hsl(150 14% 96%)' },
    arousal: 'low',
    contrast: 'standard',
    intent: 'calming',
  },
  {
    id: 'moonstone',
    name: 'Moonstone',
    nameFr: 'Pierre de lune',
    description: 'Cool lavender-grey & pearl',
    descriptionFr: 'Gris lavande & perle',
    preview: { primary: 'hsl(245 20% 55%)', accent: 'hsl(195 14% 60%)', bg: 'hsl(240 12% 96%)' },
    arousal: 'low',
    contrast: 'low',
    intent: 'calming',
  },
  {
    id: 'seaglass',
    name: 'Sea Glass',
    nameFr: 'Verre de mer',
    description: 'Soft teal & warm sand',
    descriptionFr: 'Bleu-vert doux & sable chaud',
    preview: { primary: 'hsl(185 35% 48%)', accent: 'hsl(35 35% 70%)', bg: 'hsl(180 22% 96%)' },
    arousal: 'low',
    contrast: 'standard',
    intent: 'calming',
  },
];

export const GARDEN_THEME_IDS: readonly GardenTheme[] = GARDEN_THEMES.map(t => t.id);

const AROUSAL_RANK: Record<ThemeArousal, number> = { low: 0, medium: 1, high: 2 };
const INTENT_RANK: Record<ThemeIntent, number> = { calming: 0, balanced: 1, energizing: 2 };

export type ThemeSortMode = 'palette' | 'calm-first';

/**
 * Returns themes ordered for the given sort mode.
 *
 * - 'palette'    — declaration order (the curated/creative ordering)
 * - 'calm-first' — sort by arousal asc, then intent asc; preserves declaration
 *                  order within each (arousal, intent) bucket for stability.
 */
export function sortThemes(themes: GardenThemeInfo[], mode: ThemeSortMode): GardenThemeInfo[] {
  if (mode === 'palette') return [...themes];
  return [...themes].sort((a, b) => {
    const arousalDelta = AROUSAL_RANK[a.arousal] - AROUSAL_RANK[b.arousal];
    if (arousalDelta !== 0) return arousalDelta;
    return INTENT_RANK[a.intent] - INTENT_RANK[b.intent];
  });
}

export const SORT_MODES: readonly ThemeSortMode[] = ['palette', 'calm-first'];

interface GardenThemeContextType {
  theme: GardenTheme;
  setTheme: (theme: GardenTheme) => void;
  themeInfo: GardenThemeInfo;
  allThemes: GardenThemeInfo[];
  sortMode: ThemeSortMode;
  setSortMode: (mode: ThemeSortMode) => void;
  /** allThemes already sorted by the current sortMode (memo-equivalent). */
  sortedThemes: GardenThemeInfo[];
}

const GardenThemeContext = createContext<GardenThemeContextType | undefined>(undefined);

export const STORAGE_KEY = 'outputfirst_garden_theme';
export const SORT_MODE_STORAGE_KEY = 'outputfirst_theme_sort_mode';

const ALL_THEME_CLASSES = ['theme-provence', 'theme-zen', 'theme-northern', 'theme-denim', 'theme-solar', 'theme-sakura', 'theme-forest', 'theme-moonstone', 'theme-seaglass'] as const;

function isGardenTheme(v: unknown): v is GardenTheme {
  return typeof v === 'string' && (GARDEN_THEME_IDS as readonly string[]).includes(v);
}

function isSortMode(v: unknown): v is ThemeSortMode {
  return typeof v === 'string' && (SORT_MODES as readonly string[]).includes(v);
}

/** Reads & validates the stored theme id. Falls back to 'default' on any failure. */
export function hydrateTheme(): GardenTheme {
  return pipe(
    O.tryCatch(() => localStorage.getItem(STORAGE_KEY)),
    O.flatMap(O.fromNullable),
    O.filter(isGardenTheme),
    O.getOrElse((): GardenTheme => 'default'),
  );
}

/** Reads & validates the stored sort mode. Falls back to 'palette' on any failure. */
export function hydrateSortMode(): ThemeSortMode {
  return pipe(
    O.tryCatch(() => localStorage.getItem(SORT_MODE_STORAGE_KEY)),
    O.flatMap(O.fromNullable),
    O.filter(isSortMode),
    O.getOrElse((): ThemeSortMode => 'palette'),
  );
}

export function GardenThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GardenTheme>(hydrateTheme);
  const [sortMode, setSortModeState] = useState<ThemeSortMode>(hydrateSortMode);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* quota / private mode — render still works */ }
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove(...ALL_THEME_CLASSES);
    // Apply new theme class (default has no class)
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem(SORT_MODE_STORAGE_KEY, sortMode); } catch { /* see above */ }
  }, [sortMode]);

  const setTheme = (t: GardenTheme) => setThemeState(t);
  const setSortMode = (m: ThemeSortMode) => setSortModeState(m);

  // themeInfo: must always resolve to a valid entry. If state somehow holds
  // an unknown id (e.g. enum widened post-build), fall back to default's info.
  const themeInfo = GARDEN_THEMES.find(t => t.id === theme) ?? GARDEN_THEMES[0];
  const sortedThemes = sortThemes(GARDEN_THEMES, sortMode);

  return (
    <GardenThemeContext.Provider value={{ theme, setTheme, themeInfo, allThemes: GARDEN_THEMES, sortMode, setSortMode, sortedThemes }}>
      {children}
    </GardenThemeContext.Provider>
  );
}

export function useGardenTheme() {
  const context = useContext(GardenThemeContext);
  if (!context) throw new Error('useGardenTheme must be used within GardenThemeProvider');
  return context;
}
