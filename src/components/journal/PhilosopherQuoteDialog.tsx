import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage, type PrimaryLang } from '@/contexts/LanguageContext';
import { pickQuoteForDay } from '@/data/philosopher-quotes';
import {
  QUOTES_LAST_SHOWN_KEY,
  useQuotesEnabled,
} from '@/hooks/useQuotesEnabled';

interface PhilosopherQuoteDialogProps {
  /**
   * True when mounted on a screen where the quote may appear (e.g. the
   * journal 'complete' step). Toggling this prop on triggers the
   * once-per-day open check.
   */
  active: boolean;
}

function todayStr(): string {
  // Local-date YYYY-MM-DD — Asia/Tokyo and America/LA users should both see
  // a fresh quote when their own calendar day rolls over.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function glossFor(translation: Record<string, string | undefined>, primary: PrimaryLang): string {
  return translation[primary] ?? translation.en ?? '';
}

export function PhilosopherQuoteDialog({ active }: PhilosopherQuoteDialogProps) {
  const { targetLang, primaryLang, t } = useLanguage();
  const [enabled, setEnabled] = useQuotesEnabled();
  const [open, setOpen] = useState(false);

  const quote = useMemo(() => pickQuoteForDay(targetLang), [targetLang]);

  useEffect(() => {
    if (!active || !enabled || !quote) return;
    const today = todayStr();
    if (localStorage.getItem(QUOTES_LAST_SHOWN_KEY) === today) return;
    setOpen(true);
    try { localStorage.setItem(QUOTES_LAST_SHOWN_KEY, today); } catch { /* quota */ }
  }, [active, enabled, quote]);

  if (!quote) return null;

  const gloss = glossFor(quote.translation, primaryLang);
  const year = quote.source.year !== undefined
    ? (quote.source.year < 0 ? `${-quote.source.year} BCE` : `${quote.source.year}`)
    : null;
  const attribution = [
    quote.source.author,
    quote.source.work,
    year,
  ].filter(Boolean).join(' · ');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" data-testid="philosopher-quote-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif text-base text-muted-foreground">
            {t({
              fr: 'Pensée du jour',
              en: 'Thought of the day',
              es: 'Pensamiento del día',
              ja: '今日の言葉',
              'zh-Hans': '每日一思',
              'zh-Hant': '每日一思',
            }).primary}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {attribution}
          </DialogDescription>
        </DialogHeader>

        <blockquote className="space-y-3">
          <p className="font-serif text-xl leading-relaxed text-foreground">
            {quote.original}
          </p>
          <p className="text-sm text-muted-foreground">— {attribution}</p>
        </blockquote>

        {gloss && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm italic text-muted-foreground">{gloss}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setEnabled(false);
              setOpen(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            {t({
              fr: 'Ne plus afficher',
              en: "Don't show again",
              es: 'No mostrar de nuevo',
              ja: '今後表示しない',
              'zh-Hans': '不再显示',
              'zh-Hant': '不再顯示',
            }).primary}
          </button>
          <Button size="sm" onClick={() => setOpen(false)}>
            {t({
              fr: 'Merci',
              en: 'Thanks',
              es: 'Gracias',
              ja: 'ありがとう',
              'zh-Hans': '谢谢',
              'zh-Hant': '謝謝',
            }).primary}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
