import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface ReflectionScreenProps {
  journalContent: string;
  emotions?: string;
  emotionsFr?: string;
  onContinue: (reflectionResponse?: string) => void;
  onBack: () => void;
}

interface ReflectionData {
  reflection: string;
  question: string;
}

export function ReflectionScreen({ 
  journalContent, 
  emotions,
  emotionsFr,
  onContinue, 
  onBack 
}: ReflectionScreenProps) {
  const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    generateReflection();
  }, []);

  const generateReflection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reflection`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            journalContent,
            emotions: emotionsFr || emotions || 'none selected'
          }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to generate reflection');
      }

      const data = await res.json();
      setReflectionData(data);
    } catch (err) {
      console.error('Error generating reflection:', err);
      setError('Unable to generate reflection. You can continue to the next step.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    onContinue(response.trim() || undefined);
  };

  const handleSkip = () => {
    onContinue(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">Retour / Back</span>
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
            <p className="text-muted-foreground text-sm">
              Prenant un moment pour réfléchir... / Taking a moment to reflect...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 flex flex-col">
            <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
            <div className="mt-auto">
              <Button variant="default" size="full" onClick={handleSkip}>
                <ArrowRight className="w-5 h-5 mr-2" />
                Continuer / Continue
              </Button>
            </div>
          </div>
        )}

        {/* Reflection Content */}
        {reflectionData && !isLoading && (
          <>
            {/* Acknowledgment */}
            <div className="mb-6 p-5 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-foreground leading-relaxed">
                {reflectionData.reflection}
              </p>
            </div>

            {/* Curious Question */}
            <div className="mb-8 space-y-3">
              <h2 className="font-serif text-xl md:text-2xl text-foreground leading-relaxed">
                {reflectionData.question}
              </h2>
            </div>

            {/* Optional Response */}
            <div className="flex-1">
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Prenez votre temps... / Take your time..."
                className="min-h-[120px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
              />
              <p className="text-muted-foreground text-xs mt-2">
                C'est optionnel. Passez si vous préférez. / This is optional. Skip if you prefer.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <Button
                variant="default"
                size="full"
                onClick={handleContinue}
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Continuer / Continue
              </Button>
              
              <Button
                variant="skip"
                size="full"
                onClick={handleSkip}
              >
                Passer / Skip
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
