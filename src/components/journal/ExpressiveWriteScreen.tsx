import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineAssistBar } from './InlineAssistBar';
import { useInlineAssist } from '@/hooks/useInlineAssist';

interface ExpressiveWriteScreenProps {
  onSave: (content: string) => void;
  onBack: () => void;
}

const SESSION_DURATION_MS = 20 * 60 * 1000; // 20 minutes
const STORAGE_KEY = 'expressive_sessions';
const SELF_CARE_DELAY_MS = 10_000; // 10 seconds

const countWords = (text: string): number =>
  text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

type Phase = 'intro' | 'writing' | 'selfcare';

export function ExpressiveWriteScreen({ onSave, onBack }: ExpressiveWriteScreenProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>('intro');
  const [content, setContent] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions, loading: assistLoading } = useInlineAssist(content);

  const sessionCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);

  // Auto-advance from intro after 5 seconds
  useEffect(() => {
    if (phase !== 'intro') return;
    const timer = setTimeout(() => setPhase('writing'), 5000);
    return () => clearTimeout(timer);
  }, [phase]);

  // Timer loop during writing phase
  const tick = useCallback(() => {
    const now = Date.now();
    const ms = now - startTimeRef.current;
    setElapsed(ms);
    if (ms >= SESSION_DURATION_MS) {
      setPhase('selfcare');
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  useEffect(() => {
    if (phase !== 'writing') return;
    if (startTimeRef.current === 0) startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, tick]);

  // Self-care delay
  useEffect(() => {
    if (phase !== 'selfcare') return;
    const timer = setTimeout(() => setCanContinue(true), SELF_CARE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleFinishEarly = () => {
    cancelAnimationFrame(rafRef.current);
    setPhase('selfcare');
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, String(sessionCount + 1));
    if (content.trim()) onSave(content.trim());
    else onBack();
  };

  const progress = Math.min((elapsed / SESSION_DURATION_MS) * 100, 100);
  const minutesLeft = Math.max(0, Math.ceil((SESSION_DURATION_MS - elapsed) / 60_000));
  const wordCount = countWords(content);

  // Intro phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in-up">
        <div className="w-full max-w-md text-center space-y-6">
          <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed">
            {t(
              'Écrivez sur quelque chose de profondément personnel.',
              'Write about something deeply personal.',
              'Escribe sobre algo profundamente personal.'
            ).primary}
          </p>
          <p className="text-muted-foreground text-base italic">
            {t(
              'Ceci est privé et uniquement pour vous.',
              'This is private and only for you.',
              'Esto es privado y solo para ti.'
            ).primary}
          </p>
          <p className="text-muted-foreground text-sm">
            {t(
              'Ne vous souciez ni de la grammaire ni de l\'orthographe — laissez couler.',
              'Don\'t worry about grammar or spelling — just let it flow.',
              'No te preocupes por la gramática o la ortografía — déjalo fluir.'
            ).primary}
          </p>
          <div className="pt-4">
            <button
              onClick={() => setPhase('writing')}
              className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
            >
              {t('Commencer maintenant', 'Start now', 'Empezar ahora').primary}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Self-care phase
  if (phase === 'selfcare') {
    const newCount = sessionCount + 1;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in-up">
        <div className="w-full max-w-md text-center space-y-6">
          <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed">
            {t(
              'Il est normal de ressentir des émotions intenses.',
              'It\'s normal to feel intense emotions.',
              'Es normal sentir emociones intensas.'
            ).primary}
          </p>
          <p className="text-muted-foreground text-base italic">
            {t(
              'Prenez un moment pour respirer.',
              'Take a moment to breathe.',
              'Tómate un momento para respirar.'
            ).primary}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            {t('Session', 'Session', 'Sesión').primary} {newCount} / 4
          </p>
          <div className="pt-6">
            <Button
              variant="default"
              size="full"
              onClick={handleSave}
              disabled={!canContinue}
              className={!canContinue ? 'opacity-40' : ''}
            >
              {t('Continuer', 'Continue', 'Continuar').primary}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {!canContinue && (
              <p className="text-xs text-muted-foreground mt-3 animate-gentle-pulse">
                {t('Un moment...', 'One moment...', 'Un momento...').primary}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Writing phase
  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Progress bar */}
        <Progress value={progress} className="h-1 mb-6" />

        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t('Retour', 'Back', 'Volver').primary}</span>
        </button>

        <div className="flex-1 flex flex-col space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t(
              'Laissez vos pensées et émotions couler librement...',
              'Let your thoughts and emotions flow freely...',
              'Deja fluir tus pensamientos y emociones libremente...'
            ).primary}
            className="flex-1 min-h-[300px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
            autoFocus
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {wordCount > 0 && (
                <>
                  <span className="font-medium text-foreground">{wordCount}</span>{' '}
                  {t('mots', 'words', 'palabras').primary}
                </>
              )}
            </span>
            <span>
              ~{minutesLeft} min
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Button
            variant="ghost"
            size="full"
            onClick={handleFinishEarly}
            className="text-muted-foreground"
          >
            {t('Terminer maintenant', 'Finish early', 'Terminar ahora').primary}
          </Button>
        </div>
      </div>
    </div>
  );
}
