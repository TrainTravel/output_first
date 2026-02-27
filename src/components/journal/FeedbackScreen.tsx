import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmotionAlternative {
  fr: string;
  en: string;
  nuance: string;
}

interface FeedbackResponse {
  acknowledgment?: { fr: string; en: string };
  emotionalGranularity?: {
    detected: string | null;
    alternatives: EmotionAlternative[];
  };
  languageNote?: {
    original: string;
    improved: string;
    note: { fr: string; en: string };
  } | null;
  encouragement?: { fr: string; en: string };
  suggestions?: Array<{
    original: string;
    improved: string;
    explanation: { fr: string; en: string };
  }>;
  vocabulary?: {
    word: { fr: string; en: string };
    example: { fr: string; en: string };
  };
  raw?: string;
  error?: string;
}

interface FeedbackScreenProps {
  journalContent: string;
  onContinue: () => void;
  onSkip: () => void;
}

export function FeedbackScreen({ journalContent, onContinue, onSkip }: FeedbackScreenProps) {
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, bilingual, isFr } = useLanguage();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke('french-feedback', {
          body: { text: journalContent, type: 'feedback' },
        });

        if (fnError) {
          const errorMsg = fnError.message || 'Failed to get feedback';
          throw new Error(errorMsg);
        }
        if (data?.error) {
          const errorMsg = data.code
            ? `${data.error} (${data.code})`
            : data.error;
          throw new Error(errorMsg);
        }

        if (data?.raw) {
          const rawContent = data.raw;
          const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1].trim());
              setFeedback(parsed);
              return;
            } catch {
              setFeedback(data);
              return;
            }
          }
        }

        setFeedback(data);
      } catch (err) {
        console.error('Feedback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to get feedback');
      } finally {
        setIsLoading(false);
      }
    };

    if (journalContent) fetchFeedback();
  }, [journalContent]);

  const acknowledgment = feedback?.acknowledgment || feedback?.encouragement;
  const hasEmotionalGranularity = feedback?.emotionalGranularity?.detected &&
    feedback?.emotionalGranularity?.alternatives?.length > 0;

  const headerText = t('Un moment de clarté', 'A moment of clarity', 'Un momento de claridad');

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">
              {headerText.primary}
            </h2>
          </div>
          <p className="text-muted-foreground italic">
            {headerText.secondary}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground">
                Reading what you wrote...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-muted-foreground text-sm mt-2">
                You can skip this step and continue.
              </p>
            </div>
          )}

          {feedback && !feedback.error && (
            <div className="space-y-6">
              {/* Acknowledgment */}
              {acknowledgment && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
                  <p className="text-foreground">
                    {isFr ? acknowledgment.fr : acknowledgment.en}
                  </p>
                  <p className="text-muted-foreground text-sm italic mt-2">
                    {isFr ? acknowledgment.en : acknowledgment.fr}
                  </p>
                </div>
              )}

              {/* Emotional Granularity */}
              {hasEmotionalGranularity && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {bilingual('Nommer avec précision', 'Naming with precision', 'Nombrar con precisión')}
                    </span>
                  </div>

                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 space-y-4">
                    <p className="text-muted-foreground text-sm">
                      You used "<span className="text-foreground font-medium">{feedback.emotionalGranularity!.detected}</span>" —
                      here are some words that might capture it more precisely:
                    </p>

                    <div className="space-y-3">
                      {feedback.emotionalGranularity!.alternatives.map((alt, index) => (
                        <div key={index} className="bg-background/50 rounded-lg p-3 border border-border/50">
                          <div className="flex items-baseline gap-2">
                            <span className="text-foreground font-medium">{isFr ? alt.fr : alt.en}</span>
                            <span className="text-muted-foreground text-sm">({isFr ? alt.en : alt.fr})</span>
                          </div>
                          <p className="text-muted-foreground/80 text-xs mt-1 italic">{alt.nuance}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-muted-foreground/60 text-xs pt-2 border-t border-border/30">
                      Does one of these resonate? You can use it next time.
                    </p>
                  </div>
                </div>
              )}

              {/* Language Note */}
              {feedback.languageNote && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{bilingual('Une petite note', 'A small note', 'Una pequeña nota')}</span>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{feedback.languageNote.original}</span>
                      <span className="text-primary">→</span>
                      <span className="text-foreground">{feedback.languageNote.improved}</span>
                    </div>
                    <p className="text-muted-foreground/70 text-xs">
                      {isFr ? feedback.languageNote.note.fr : feedback.languageNote.note.en}
                    </p>
                    <p className="text-muted-foreground/50 text-xs italic">
                      {isFr ? feedback.languageNote.note.en : feedback.languageNote.note.fr}
                    </p>
                  </div>
                </div>
              )}

              {/* Legacy suggestions fallback */}
              {!feedback.languageNote && feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{bilingual('Une petite note', 'A small note', 'Una pequeña nota')}</span>
                  </div>
                  {feedback.suggestions.slice(0, 1).map((suggestion, index) => (
                    <div key={index} className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{suggestion.original}</span>
                        <span className="text-primary">→</span>
                        <span className="text-foreground">{suggestion.improved}</span>
                      </div>
                      <p className="text-muted-foreground/70 text-xs">
                        {isFr ? suggestion.explanation.fr : suggestion.explanation.en}
                      </p>
                      <p className="text-muted-foreground/50 text-xs italic">
                        {isFr ? suggestion.explanation.en : suggestion.explanation.fr}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Raw response fallback */}
              {feedback.raw && !acknowledgment && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-foreground whitespace-pre-wrap">{feedback.raw}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Button variant="default" size="full" onClick={onContinue}>
            {t('Continuer', 'Continue', 'Continuar').primary}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {isLoading && (
            <Button variant="skip" size="full" onClick={onSkip}>
              {t('Passer', 'Skip', 'Omitir').primary}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
