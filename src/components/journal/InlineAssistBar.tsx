import { useLanguage } from '@/contexts/LanguageContext';
import type { InlineSuggestion } from '@/hooks/useInlineAssist';

interface InlineAssistBarProps {
  suggestions: InlineSuggestion[];
  loading: boolean;
  onInsert: (word: string) => void;
}

export function InlineAssistBar({ suggestions, loading, onInsert }: InlineAssistBarProps) {
  const { t, targetLang } = useLanguage();
  const isZh = targetLang === 'zh-Hans' || targetLang === 'zh-Hant';

  if (suggestions.length === 0 && !loading) return null;

  return (
    <div className="animate-fade-in-up space-y-2">
      {loading && suggestions.length === 0 && (
        <p className="text-xs text-muted-foreground italic animate-gentle-pulse">
          {t({ fr: 'Analyse en cours...', en: 'Analyzing...', es: 'Analizando...', 'zh-Hans': '分析中...', 'zh-Hant': '分析中...' }).primary}
        </p>
      )}
      {suggestions.map((s, i) => (
        <div key={`${s.original}-${i}`} className="p-3 rounded-xl border border-border bg-card/50 text-sm">
          <p className="text-muted-foreground mb-1.5">
            {s.type === 'l1' ? (
              <>
                {t({ fr: 'Vous avez écrit', en: 'You wrote', es: 'Escribiste', 'zh-Hans': '你写了', 'zh-Hant': '你寫了' }).primary}{' '}
                <span className="font-semibold text-foreground">{s.original}</span>
                {' → '}
                {t({ fr: 'essayez', en: 'try', es: 'prueba', 'zh-Hans': '试试', 'zh-Hant': '試試' }).primary}
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{s.original}</span>
                {' → '}
                {t({ fr: 'plus précis', en: 'more precise', es: 'más preciso', 'zh-Hans': '更精准', 'zh-Hant': '更精準' }).primary}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {s.suggestions.map((alt, idx) => {
              const word = isZh ? (alt.zh ?? '') : (alt.fr ?? '');
              if (!word) return null;
              return (
                <button
                  key={`${word}-${idx}`}
                  onClick={() => onInsert(word)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
                  title={alt.nuance}
                >
                  {word}
                  {isZh && alt.pinyin && (
                    <span className="text-muted-foreground">{alt.pinyin}</span>
                  )}
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground italic">{alt.nuance}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
