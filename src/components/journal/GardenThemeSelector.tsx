import { useGardenTheme, GardenThemeInfo } from '@/contexts/GardenThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';
import { useState } from 'react';

function ThemeCard({ info, isActive, onSelect }: { info: GardenThemeInfo; isActive: boolean; onSelect: () => void }) {
  const { isFr } = useLanguage();

  return (
    <button
      onClick={onSelect}
      className={`
        relative w-full rounded-lg p-4 text-left transition-all duration-300
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
}

export function GardenThemeSelector() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme, allThemes } = useGardenTheme();
  const { t } = useLanguage();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Palette className="w-4 h-4 mr-1" />
        {t('Thème', 'Theme').primary}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {t('Choisir un jardin', 'Choose a garden').primary}
            </DialogTitle>
            <DialogDescription className="text-sm italic">
              {t('Choisir un jardin', 'Choose a garden').secondary}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {allThemes.map((info) => (
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
