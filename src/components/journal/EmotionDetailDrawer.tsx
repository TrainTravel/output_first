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
  const { t, bilingual, isZh, zhVariant } = useLanguage();
  const fetchWord = isOpen && word ? word.en : null;
  const { examples, loading } = useDictionaryExamples(fetchWord);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[65vh]">
        {word && (
          <>
            <DrawerHeader>
              <div className="flex gap-2 mb-2">
                {(['en', 'fr', 'es', 'zh-Hans', 'zh-Hant'] as const).map(code => (
                  <span
                    key={code}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      language === code
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {code === 'zh-Hans' ? '简' : code === 'zh-Hant' ? '繁' : code}
                  </span>
                ))}
              </div>
              <DrawerTitle className="font-serif text-2xl text-foreground text-left">
                {isZh ? (
                  <>
                    {zhVariant === 'Hant' ? word.zhHant : word.zhHans}
                    {word.pinyin && <span className="text-base font-sans text-muted-foreground ml-2">({word.pinyin})</span>}
                    <span className="text-base font-sans text-muted-foreground ml-2">/ {word.en}</span>
                  </>
                ) : bilingual(word.fr, word.en, word.es)}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {word.nuance}
              </DrawerDescription>
            </DrawerHeader>

            <div className="overflow-y-auto px-4 pb-2 flex-1">
              <p className="text-sm italic text-muted-foreground mb-4">{word.nuance}</p>

              {/* Chinese Collocations */}
              {isZh && word.zhCollocations && word.zhCollocations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t('Expressions courantes', 'Common expressions', 'Expresiones comunes', '常见表达', '常見表達').primary}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {word.zhCollocations.map((col, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-xs border border-accent/30 bg-accent/5 text-accent-foreground"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* French/Spanish Collocations */}
              {!isZh && word.collocations && word.collocations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t('Expressions courantes', 'Common expressions', 'Expresiones comunes').primary}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {word.collocations.map((col, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-xs border border-accent/30 bg-accent/5 text-accent-foreground italic"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
