import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineAssistBar } from './InlineAssistBar';
import { useInlineAssist } from '@/hooks/useInlineAssist';

interface FreeWriteScreenProps {
  onSave: (content: string) => void;
  onBack: () => void;
}

const countWords = (text: string): number =>
  text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

export function FreeWriteScreen({ onSave, onBack }: FreeWriteScreenProps) {
  const [content, setContent] = useState('');
  const { t, bilingual } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions, loading: assistLoading } = useInlineAssist(content);

  const wordCount = countWords(content);

  const handleSubmit = () => {
    if (content.trim()) onSave(content.trim());
  };

  const insertWord = (word: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + word + ' ');
      return;
    }
    const start = el.selectionStart;
    const before = content.slice(0, start);
    const after = content.slice(el.selectionEnd);
    const space = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const newContent = before + space + word + ' ' + after;
    setContent(newContent);
    requestAnimationFrame(() => {
      const pos = start + space.length + word.length + 1;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver' }).primary}</span>
        </button>

        <div className="mb-8">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed">
            {bilingual({ fr: 'Écrire librement', en: 'Free Write', es: 'Escritura libre' })}
          </h2>
          <p className="text-muted-foreground text-sm italic mt-2">
            {t({ fr: 'Pas de structure. Juste vous et vos mots.', en: 'No structure. Just you and your words.', es: 'Sin estructura. Solo tú y tus palabras.' }).primary}
          </p>
        </div>

        <div className="flex-1 flex flex-col space-y-3">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t({ fr: 'Écrivez ce qui vous vient...', en: 'Write whatever comes...', es: 'Escribe lo que te venga...' }).primary}
            className="flex-1 min-h-[300px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
          />

          <InlineAssistBar
            suggestions={suggestions}
            loading={assistLoading}
            onInsert={insertWord}
          />

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {wordCount > 0 ? (
                <span>
                  <span className="font-medium text-foreground">{wordCount}</span>{' '}
                  {t({ fr: 'mots', en: 'words', es: 'palabras' }).primary}
                </span>
              ) : (
                t({ fr: 'Une ou deux phrases suffisent.', en: 'One or two sentences is enough.', es: 'Una o dos frases bastan.' }).primary
              )}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button
            variant="default"
            size="full"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            {t({ fr: 'Terminer', en: 'Finish', es: 'Terminar' }).primary}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
