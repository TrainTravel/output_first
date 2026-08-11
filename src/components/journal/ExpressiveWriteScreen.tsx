import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineAssistBar } from './InlineAssistBar';
import { useInlineAssist } from '@/hooks/useInlineAssist';
import { EXPRESSIVE_PROMPTS, promptHeadingClass } from '@/types/journal';


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
  const [promptIdx, setPromptIdx] = useState<number | null>(
    () => Math.floor(Math.random() * EXPRESSIVE_PROMPTS.length)
  );
  // Touching the prompt means the user is reading, not skimming — stop the
  // intro from auto-advancing out from under them.
  const [autoAdvance, setAutoAdvance] = useState(true);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions, loading: assistLoading } = useInlineAssist(content);

  const sessionCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);

  const activePrompt = promptIdx === null ? null : EXPRESSIVE_PROMPTS[promptIdx];
  const promptText = activePrompt
    ? t({ fr: activePrompt.fr, en: activePrompt.en, es: activePrompt.en, 'zh-Hans': activePrompt.zhHans, 'zh-Hant': activePrompt.zhHant })
    : null;

  const cyclePrompt = () => {
    setAutoAdvance(false);
    setPromptIdx(prev => ((prev ?? -1) + 1) % EXPRESSIVE_PROMPTS.length);
  };

  const useBlankPage = () => {
    setAutoAdvance(false);
    setPromptIdx(null);
  };

  // Auto-advance from intro after 5 seconds
  useEffect(() => {
    if (phase !== 'intro' || !autoAdvance) return;
    const timer = setTimeout(() => setPhase('writing'), 5000);
    return () => clearTimeout(timer);
  }, [phase, autoAdvance]);


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
              { fr: 'Écrivez sur quelque chose de profondément personnel.', en: 'Write about something deeply personal.', es: 'Escribe sobre algo profundamente personal.', ja: '心の奥にあることを書いてみましょう。', 'zh-Hans': '写下一件深处的事。', 'zh-Hant': '寫下一件深處的事。' }
            ).primary}
          </p>
          <p className="text-muted-foreground text-base italic">
            {t(
              { fr: 'Ceci est privé et uniquement pour vous.', en: 'This is private and only for you.', es: 'Esto es privado y solo para ti.', ja: 'これはあなただけのものです。', 'zh-Hans': '这只属于你自己。', 'zh-Hant': '這只屬於你自己。' }
            ).primary}
          </p>
          <p className="text-muted-foreground text-sm">
            {t(
              { fr: 'Ne vous souciez ni de la grammaire ni de l\'orthographe — laissez couler.', en: 'Don\'t worry about grammar or spelling — just let it flow.', es: 'No te preocupes por la gramática o la ortografía — déjalo fluir.', ja: '文法や綴りは気にせず、流れるままに書きましょう。', 'zh-Hans': '别在意语法或拼写，让文字自然流出。', 'zh-Hant': '別在意文法或拼字，讓文字自然流出。' }
            ).primary}
          </p>
          <div className="pt-4">
            <button
              onClick={() => setPhase('writing')}
              className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
            >
              {t({ fr: 'Commencer maintenant', en: 'Start now', es: 'Empezar ahora', ja: '今すぐ始める', 'zh-Hans': '立即开始', 'zh-Hant': '立即開始' }).primary}
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
              { fr: 'Il est normal de ressentir des émotions intenses.', en: 'It\'s normal to feel intense emotions.', es: 'Es normal sentir emociones intensas.', ja: '強い感情がわいてくるのは自然なことです。', 'zh-Hans': '出现强烈情绪是很自然的。', 'zh-Hant': '出現強烈情緒是很自然的。' }
            ).primary}
          </p>
          <p className="text-muted-foreground text-base italic">
            {t(
              { fr: 'Prenez un moment pour respirer.', en: 'Take a moment to breathe.', es: 'Tómate un momento para respirar.', ja: '少し深呼吸しましょう。', 'zh-Hans': '稍作停顿，深呼吸一下。', 'zh-Hant': '稍作停頓，深呼吸一下。' }
            ).primary}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            {t({ fr: 'Session', en: 'Session', es: 'Sesión', ja: 'セッション', 'zh-Hans': '场次', 'zh-Hant': '場次' }).primary} {newCount} / 4
          </p>
          <div className="pt-6">
            <Button
              variant="default"
              size="full"
              onClick={handleSave}
              disabled={!canContinue}
              className={!canContinue ? 'opacity-40' : ''}
            >
              {t({ fr: 'Continuer', en: 'Continue', es: 'Continuar', ja: '続ける', 'zh-Hans': '继续', 'zh-Hant': '繼續' }).primary}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {!canContinue && (
              <p className="text-xs text-muted-foreground mt-3 animate-gentle-pulse">
                {t({ fr: 'Un moment...', en: 'One moment...', es: 'Un momento...', ja: '少々お待ちください...', 'zh-Hans': '稍等一下...', 'zh-Hant': '稍等一下...' }).primary}
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
          <span className="text-sm">{t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}</span>
        </button>

        <div className="flex-1 flex flex-col space-y-3">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t(
              { fr: 'Laissez vos pensées et émotions couler librement...', en: 'Let your thoughts and emotions flow freely...', es: 'Deja fluir tus pensamientos y emociones libremente...', ja: '思いも感情も、自由に流れるままに...', 'zh-Hans': '让思绪和情绪自由流淌...', 'zh-Hant': '讓思緒和情緒自由流淌...' }
            ).primary}
            className="flex-1 min-h-[300px] resize-none bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20 text-lg leading-relaxed p-4 rounded-xl"
            autoFocus
          />

          <InlineAssistBar
            suggestions={suggestions}
            loading={assistLoading}
            onInsert={(word) => {
              const el = textareaRef.current;
              if (!el) {
                setContent(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + word + ' ');
                return;
              }
              const start = el.selectionStart;
              const before = content.slice(0, start);
              const after = content.slice(el.selectionEnd);
              const space = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
              setContent(before + space + word + ' ' + after);
              requestAnimationFrame(() => {
                const pos = start + space.length + word.length + 1;
                el.focus();
                el.setSelectionRange(pos, pos);
              });
            }}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {wordCount > 0 && (
                <>
                  <span className="font-medium text-foreground">{wordCount}</span>{' '}
                  {t({ fr: 'mots', en: 'words', es: 'palabras', ja: '語', 'zh-Hans': '字', 'zh-Hant': '字' }).primary}
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
            {t({ fr: 'Terminer maintenant', en: 'Finish early', es: 'Terminar ahora', ja: '今すぐ終える', 'zh-Hans': '提前结束', 'zh-Hant': '提前結束' }).primary}
          </Button>
        </div>
      </div>
    </div>
  );
}
