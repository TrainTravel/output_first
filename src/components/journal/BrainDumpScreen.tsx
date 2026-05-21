import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap } from 'lucide-react';
import { useThoughts, Thought } from '@/hooks/useThoughts';
import { useLanguage } from '@/contexts/LanguageContext';

interface BrainDumpScreenProps {
  onBack: () => void;
}

const PLACEHOLDERS_EN = [
  "What's on your mind?",
  "Any idea, big or small…",
  "A fleeting thought…",
  "Something you want to remember…",
  "No pressure, just dump it…",
];

const PLACEHOLDERS_FR = [
  "Qu'avez-vous en tête ?",
  "Une idée, grande ou petite…",
  "Une pensée passagère…",
  "Quelque chose à retenir…",
  "Sans pression, videz votre esprit…",
];

const PLACEHOLDERS_ES = [
  "¿Qué tienes en mente?",
  "Cualquier idea, grande o pequeña…",
  "Un pensamiento fugaz…",
  "Algo que quieras recordar…",
  "Sin presión, solo suéltalo…",
];

export function BrainDumpScreen({ onBack }: BrainDumpScreenProps) {
  const { bilingual, t, targetLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
  const { addThought, thoughts } = useThoughts();
  const [input, setInput] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState<Thought[]>([]);
  const [saving, setSaving] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const placeholders = isFr ? PLACEHOLDERS_FR : isEs ? PLACEHOLDERS_ES : PLACEHOLDERS_EN;
  const currentPlaceholder = placeholders[placeholderIdx % placeholders.length];

  const submitThought = async (text: string) => {
    if (!text || saving) return;
    setSaving(true);
    const thought = await addThought(text);
    setSaving(false);
    if (thought) {
      setRecentlyAdded(prev => [thought, ...prev].slice(0, 5));
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async () => submitThought(input.trim());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };


  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('Retour', 'Back', 'Volver').primary}
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Zap className="w-4 h-4" />
          <span>{thoughts.length} {t('pensées', 'thoughts', 'pensamientos').primary}</span>
        </div>
      </div>

      {/* Main input area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <h2 className="font-serif text-3xl text-foreground mb-2 text-center">
          {bilingual('Vide-tête', 'Brain Dump', 'Volcado mental')}
        </h2>
        <p className="text-muted-foreground text-sm mb-8 text-center">
          {t(
            'Une pensée à la fois. Appuyez sur Entrée pour sauvegarder.',
            'One thought at a time. Press Enter to save.',
            'Un pensamiento a la vez. Presiona Enter para guardar.'
          ).primary}
        </p>

        <div className="w-full relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentPlaceholder}
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-5 py-4 text-foreground text-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground/50 transition-all"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || saving}
            size="sm"
            className="absolute bottom-3 right-3"
          >
            {saving ? '…' : t('Ajouter', 'Add', 'Agregar').primary}
          </Button>
        </div>

        {/* Recently added thoughts - subtle confirmation */}
        {recentlyAdded.length > 0 && (
          <div className="w-full mt-8 space-y-2">
            {recentlyAdded.map((thought, i) => (
              <div
                key={thought.id}
                className="animate-fade-in-up text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 transition-opacity"
                style={{ opacity: 1 - i * 0.2 }}
              >
                {thought.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
