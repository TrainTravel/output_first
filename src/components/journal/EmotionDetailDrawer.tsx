import { EmotionWord } from '@/types/journal';
import { Language, useLanguage } from '@/contexts/LanguageContext';
import { useDictionaryExamples } from '@/hooks/useDictionaryExamples';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface EmotionDetailDrawerProps {
  word: EmotionWord | null;
  isOpen: boolean;
  isSelected: boolean;
  atMax: boolean;
  onClose: () => void;
  onToggleSelect: (word: EmotionWord) => void;
  language: Language;
}

export function EmotionDetailDrawer({
  word,
  isOpen,
  isSelected,
  atMax,
  onClose,
  onToggleSelect,
  language,
}: EmotionDetailDrawerProps) {
  const { t, bilingual } = useLanguage();
  const fetchWord = isOpen && word ? word.en : null;
  const { examples, loading } = useDictionaryExamples(fetchWord);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[65vh]">
        {word && (
          <>
            <DrawerHeader>
              <div className="flex gap-2 mb-2">
                {(['en', 'fr', 'es'] as const).map(code => (
                  <span
                    key={code}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      language === code
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {code}
                  </span>
                ))}
              </div>
              <DrawerTitle className="font-serif text-2xl text-foreground text-left">
                {bilingual(word.fr, word.en, word.es)}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {word.nuance}
              </DrawerDescription>
            </DrawerHeader>

            <div className="overflow-y-auto px-4 pb-2 flex-1">
              <p className="text-sm italic text-muted-foreground mb-4">{word.nuance}</p>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : examples.length > 0 ? (
                <>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t('Exemples', 'Examples', 'Ejemplos').primary}
                  </p>
                  <ul className="space-y-1.5">
                    {examples.map((ex, i) => (
                      <li key={i} className="text-sm text-foreground flex gap-2">
                        <span className="text-muted-foreground mt-0.5 flex-shrink-0">·</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>

            <DrawerFooter>
              <Button
                variant="default"
                size="full"
                disabled={!isSelected && atMax}
                onClick={() => {
                  onToggleSelect(word);
                  onClose();
                }}
              >
                {isSelected
                  ? t('Désélectionner', 'Deselect', 'Deseleccionar').primary
                  : t('Sélectionner', 'Select', 'Seleccionar').primary}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
