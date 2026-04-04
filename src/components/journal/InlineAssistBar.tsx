import { useLanguage } from '@/contexts/LanguageContext';
import type { InlineSuggestion } from '@/hooks/useInlineAssist';

interface InlineAssistBarProps {
  suggestions: InlineSuggestion[];
  loading: boolean;
  onInsert: (word: string) => void;
}

export function InlineAssistBar({ suggestions, loading, onInsert }: InlineAssistBarProps) {
  const { t } = useLanguage();

  if (suggestions.length === 0 && !loading) return null;

  return (
    <div className="animate-fade-in-up space-y-2">
      {loading && suggestions.length === 0 && (
        <p className="text-xs text-muted-foreground italic animate-gentle-pulse">
          {t('Analyse en cours...', 'Analyzing...', 'Analizando...').primary}
        </p>
      )}
      {suggestions.map((s, i) => (
        <div key={`${s.original}-${i}`} className="p-3 rounded-xl border border-border bg-card/50 text-sm">
          <p className="text-muted-foreground mb-1.5">
            {s.type === 'l1' ? (
              <>
                {t('Vous avez écrit', 'You wrote', 'Escribiste').primary}{' '}
                <span className="font-semibold text-foreground">{s.original}</span>
                {' → '}
                {t('essayez', 'try', 'prueba').primary}
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{s.original}</span>
                {' → '}
                {t('plus précis', 'more precise', 'más preciso').primary}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {s.suggestions.map((alt) => (
              <button
                key={alt.fr}
                onClick={() => onInsert(alt.fr)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
                title={alt.nuance}
              >
                {alt.fr}
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground italic">{alt.nuance}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
