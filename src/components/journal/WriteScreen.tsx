import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { BilingualPrompt } from '@/types/journal';

interface WriteScreenProps {
  prompt: BilingualPrompt;
  onSave: (content: string) => void;
  onBack: () => void;
}

export function WriteScreen({ prompt, onSave, onBack }: WriteScreenProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
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

        {/* Bilingual Prompt */}
        <div className="mb-8 space-y-3">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed">
            {prompt.fr}
          </h2>
          <p className="text-muted-foreground text-base italic">
            {prompt.en}
          </p>
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez en français... / Write in French..."
            className="flex-1 min-h-[200px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
          />

          <p className="text-muted-foreground text-sm text-center">
            Ne vous inquiétez pas des erreurs. / Don't worry about mistakes.
          </p>
        </div>

        {/* Continue Button */}
        <div className="mt-8 space-y-3">
          <Button
            variant="default"
            size="full"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            Continuer / Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
