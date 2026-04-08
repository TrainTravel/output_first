import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { BilingualPrompt, VocabPair } from '@/types/journal';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineAssistBar } from './InlineAssistBar';
import { useInlineAssist } from '@/hooks/useInlineAssist';

interface WriteScreenProps {
  prompt: BilingualPrompt;
  onSave: (content: string) => void;
  onBack: () => void;
  initialContent?: string;
  preloadedVocab?: VocabPair[];
}

export function WriteScreen({ prompt, onSave, onBack, initialContent, preloadedVocab }: WriteScreenProps) {
  const [content, setContent] = useState(initialContent ?? '');
  const { t, isZh, zhVariant } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions, loading: assistLoading } = useInlineAssist(content);

  const handleSubmit = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
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

  const promptText = t(prompt.fr, prompt.en, prompt.en);

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t('Retour', 'Back', 'Volver').primary}</span>
        </button>

        {/* Bilingual Prompt */}
        <div className="mb-8 space-y-3">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed">
            {promptText.primary}
          </h2>
          <p className="text-muted-foreground text-base italic">
            {promptText.secondary}
          </p>
        </div>

        {/* Preloaded Vocabulary Chips */}
        {preloadedVocab && preloadedVocab.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {t('Vocabulaire utile', 'Useful vocabulary', 'Vocabulario útil').primary}
            </p>
            <div className="flex flex-wrap gap-2">
              {preloadedVocab.map((v) => (
                <button
                  key={v.fr}
                  onClick={() => insertWord(isZh ? (zhVariant === 'Hant' ? v.zhHant || v.fr : v.zhHans || v.fr) : v.fr)}
                  className="px-3 py-1.5 rounded-full text-sm border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
                  title={v.en}
                >
                  {isZh ? (
                    <>
                      {zhVariant === 'Hant' ? v.zhHant : v.zhHans}
                      {v.pinyin && <span className="text-muted-foreground text-xs ml-1">({v.pinyin})</span>}
                      <span className="text-muted-foreground text-xs ml-1">· {v.en}</span>
                    </>
                  ) : (
                    <>
                      {v.fr} <span className="text-muted-foreground text-xs ml-1">({v.en})</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Area */}
        <div className="flex-1 flex flex-col space-y-4">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('Écrivez ici...', 'Write here...', 'Escribe aquí...').primary}
            className="flex-1 min-h-[200px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
          />

          <InlineAssistBar
            suggestions={suggestions}
            loading={assistLoading}
            onInsert={insertWord}
          />

          <p className="text-muted-foreground text-sm text-center">
            {t("Ne vous inquiétez pas des erreurs.", "Don't worry about mistakes.", "No te preocupes por los errores.").primary}
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
            {t('Continuer', 'Continue', 'Continuar').primary}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
