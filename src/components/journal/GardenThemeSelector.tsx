import { useGardenTheme, GardenThemeInfo, ThemeSortMode } from '@/contexts/GardenThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Palette, Check, Leaf, ArrowDownUp } from 'lucide-react';
import { useState, forwardRef } from 'react';

const AROUSAL_DOT: Record<GardenThemeInfo['arousal'], string> = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-400',
};

const ThemeCard = forwardRef<HTMLButtonElement, { info: GardenThemeInfo; isActive: boolean; onSelect: () => void }>(({ info, isActive, onSelect }, ref) => {
  const { targetLang } = useLanguage();
  const isFr = targetLang === 'fr';

  return (
    <button
      ref={ref}
      onClick={onSelect}
      data-theme-id={info.id}
      data-arousal={info.arousal}
      data-intent={info.intent}
      aria-pressed={isActive}
      aria-label={`${isFr ? info.nameFr : info.name} — ${info.intent}, ${info.arousal} arousal`}
      className={`
        theme-card relative w-full rounded-lg p-4 text-left transition-all duration-300
        border-2 hover:scale-[1.02]
        ${isActive
          ? 'border-primary shadow-glow'
          : 'border-border hover:border-muted-foreground/30'
        }
      `}
      style={{ background: info.preview.bg }}
    >
      {/* Color preview dots */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full shadow-sm" style={{ background: info.preview.primary }} />
        <div className="w-5 h-5 rounded-full shadow-sm" style={{ background: info.preview.accent }} />
        <div className="w-5 h-5 rounded-full border shadow-sm" style={{ background: info.preview.bg, borderColor: info.preview.primary }} />
        {/* Arousal indicator — small color-coded dot, screen-reader-labeled */}
        <span
          className={`ml-auto w-2 h-2 rounded-full ${AROUSAL_DOT[info.arousal]}`}
          aria-hidden="true"
          title={`${info.arousal} arousal`}
        />
      </div>

      <p className="font-serif text-sm font-medium" style={{ color: info.preview.primary }}>
        {isFr ? info.nameFr : info.name}
      </p>
      <p className="text-xs mt-0.5 opacity-70" style={{ color: info.preview.primary }}>
        {isFr ? info.descriptionFr : info.description}
      </p>

      {isActive && (
        <div className="absolute top-3 right-3">
          <Check className="w-4 h-4" style={{ color: info.preview.primary }} />
        </div>
      )}
    </button>
  );
});

ThemeCard.displayName = 'ThemeCard';

export function GardenThemeSelector() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme, sortMode, setSortMode, sortedThemes } = useGardenTheme();
  const { t } = useLanguage();

  const toggleSortMode = () => {
    const next: ThemeSortMode = sortMode === 'palette' ? 'calm-first' : 'palette';
    setSortMode(next);
  };

  const sortLabel = sortMode === 'calm-first'
    ? t('Doux d\'abord', 'Calm first', 'Calma primero').primary
    : t('Palette', 'Palette', 'Paleta').primary;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Palette className="w-4 h-4 mr-1" />
        {t('Thème', 'Theme', 'Tema').primary}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {t('Choisir un jardin', 'Choose a garden', 'Elegir un jardín').primary}
            </DialogTitle>
            <DialogDescription className="text-sm italic">
              {t('Choisir un jardin', 'Choose a garden', 'Elegir un jardín').secondary}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end mb-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleSortMode}
              data-sort-mode={sortMode}
              aria-label={t(
                `Tri : ${sortLabel}. Basculer.`,
                `Sort: ${sortLabel}. Toggle.`,
                `Orden: ${sortLabel}. Cambiar.`,
              ).primary}
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              {sortMode === 'calm-first'
                ? <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
                : <ArrowDownUp className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{sortLabel}</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            {sortedThemes.map((info) => (
              <ThemeCard
                key={info.id}
                info={info}
                isActive={theme === info.id}
                onSelect={() => {
                  setTheme(info.id);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
