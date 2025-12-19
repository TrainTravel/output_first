import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Loader2, BookOpen, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackResponse {
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

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke('french-feedback', {
          body: { text: journalContent, type: 'feedback' },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setFeedback(data);
      } catch (err) {
        console.error('Feedback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to get feedback');
      } finally {
        setIsLoading(false);
      }
    };

    if (journalContent) {
      fetchFeedback();
    }
  }, [journalContent]);

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">
              Retour sur votre français
            </h2>
          </div>
          <p className="text-muted-foreground italic">
            Feedback on your French
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground">
                Analysing your writing...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
              <p className="text-destructive">{error}</p>
              <p className="text-muted-foreground text-sm mt-2">
                You can skip this step and continue.
              </p>
            </div>
          )}

          {feedback && !feedback.error && (
            <div className="space-y-6">
              {/* Encouragement */}
              {feedback.encouragement && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
                  <p className="text-foreground font-medium">
                    {feedback.encouragement.fr}
                  </p>
                  <p className="text-muted-foreground text-sm italic mt-2">
                    {feedback.encouragement.en}
                  </p>
                </div>
              )}

              {/* Suggestions */}
              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm font-medium">Suggestions douces / Gentle suggestions</span>
                  </div>
                  {feedback.suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through">{suggestion.original}</span>
                        <span className="text-primary">→</span>
                        <span className="text-foreground font-medium">{suggestion.improved}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {suggestion.explanation.fr}
                      </p>
                      <p className="text-muted-foreground/60 text-xs italic">
                        {suggestion.explanation.en}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Vocabulary */}
              {feedback.vocabulary && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm font-medium">Nouveau vocabulaire / New vocabulary</span>
                  </div>
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                    <p className="text-foreground font-medium">
                      {feedback.vocabulary.word.fr}
                      <span className="text-muted-foreground font-normal ml-2">
                        ({feedback.vocabulary.word.en})
                      </span>
                    </p>
                    <p className="text-muted-foreground text-sm mt-2 italic">
                      « {feedback.vocabulary.example.fr} »
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                      "{feedback.vocabulary.example.en}"
                    </p>
                  </div>
                </div>
              )}

              {/* Raw response fallback */}
              {feedback.raw && !feedback.encouragement && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-foreground whitespace-pre-wrap">{feedback.raw}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <Button
            variant="default"
            size="full"
            onClick={onContinue}
          >
            Continuer / Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          {isLoading && (
            <Button
              variant="skip"
              size="full"
              onClick={onSkip}
            >
              Passer / Skip feedback
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
