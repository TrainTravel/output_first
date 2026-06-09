import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Loader2, LayoutGrid } from 'lucide-react';
import { useThoughts, Thought } from '@/hooks/useThoughts';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { TaskVerifyStep, type VerifyItem } from './TaskVerifyStep';
import type { Quadrant } from '@/types/journal';

interface BrainDumpScreenProps {
  onBack: () => void;
  /** Called after a successful sort flow so the caller can navigate to QuadrantsScreen. */
  onAfterSort?: () => void;
}

interface AIClassification {
  id: string;
  isTask: boolean;
  quadrant: Quadrant | null;
  reasoning: string;
}

const VALID_QUADRANTS: readonly Quadrant[] = ['q1', 'q2', 'q3', 'q4'];

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

export function BrainDumpScreen({ onBack, onAfterSort }: BrainDumpScreenProps) {
  const { bilingual, t, targetLang, primaryLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
  const { addThought, thoughts } = useThoughts();
  const [input, setInput] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState<Thought[]>([]);
  const [saving, setSaving] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Uncapped session log (separate from the display-only recentlyAdded which is limited to 5).
  // Used as the input to the eisenhower classifier when the user starts a sort.
  const [sessionThoughts, setSessionThoughts] = useState<Thought[]>([]);
  const [classifying, setClassifying] = useState(false);
  const [verifyItems, setVerifyItems] = useState<VerifyItem[] | null>(null);
  const [classifications, setClassifications] = useState<AIClassification[]>([]);
  const [sortError, setSortError] = useState<string | null>(null);

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
      setSessionThoughts(prev => [...prev, thought]);
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

  const startSort = async () => {
    if (sessionThoughts.length === 0 || classifying) return;
    setClassifying(true);
    setSortError(null);

    const items = sessionThoughts.map(t => ({ id: t.id, content: t.content }));
    try {
      const { data, error } = await supabase.functions.invoke('todo-triage', {
        body: { mode: 'eisenhower', items, primaryLang },
      });

      if (error || !data?.classifications || !Array.isArray(data.classifications)) {
        setSortError(error?.message || 'Classification failed');
        setClassifying(false);
        return;
      }

      const cls = (data.classifications as AIClassification[]).filter(c =>
        c.quadrant === null || VALID_QUADRANTS.includes(c.quadrant)
      );
      setClassifications(cls);

      const verifies: VerifyItem[] = cls
        .map(c => {
          const t = sessionThoughts.find(x => x.id === c.id);
          return t ? { id: c.id, content: t.content, isTaskGuess: !!c.isTask } : null;
        })
        .filter((v): v is VerifyItem => v !== null);

      setVerifyItems(verifies);
    } finally {
      setClassifying(false);
    }
  };

  // Writes is_task + quadrant to each classified thought row.
  // confirmedTaskIds = user's manual selection from the verify step.
  // When undefined (skip path), persist AI's classifications as-is.
  const persistClassifications = async (confirmedTaskIds?: Set<string>) => {
    await Promise.all(classifications.map(c => {
      const isTask = confirmedTaskIds ? confirmedTaskIds.has(c.id) : !!c.isTask;
      // If the user overrides a non-task to a task, AI gave no quadrant — default to q2
      // (important, not urgent) as a safe placement rather than orphaning the row.
      const quadrant: Quadrant | null = isTask ? (c.quadrant ?? 'q2') : null;
      return supabase
        .from('thoughts')
        .update({ is_task: isTask, quadrant })
        .eq('id', c.id);
    }));
  };

  const handleVerifyConfirm = async (confirmedTaskIds: string[]) => {
    await persistClassifications(new Set(confirmedTaskIds));
    setVerifyItems(null);
    setSessionThoughts([]);
    setClassifications([]);
    if (onAfterSort) onAfterSort(); else onBack();
  };

  const handleVerifySkip = async () => {
    await persistClassifications();
    setVerifyItems(null);
    setSessionThoughts([]);
    setClassifications([]);
    if (onAfterSort) onAfterSort(); else onBack();
  };


  if (verifyItems) {
    return (
      <TaskVerifyStep
        items={verifyItems}
        onConfirm={handleVerifyConfirm}
        onSkip={handleVerifySkip}
      />
    );
  }

  const canSort = sessionThoughts.length > 0 && !classifying;
  const sortLabel = t({
    fr: 'Trier en quadrants',
    en: 'Sort into quadrants',
    es: 'Clasificar en cuadrantes',
    ja: '優先順位に分類',
    'zh-Hans': '分到优先级矩阵',
    'zh-Hant': '分到優先級矩陣',
  }).primary;
  const sortingLabel = t({
    fr: 'Classification en cours…',
    en: 'Sorting…',
    es: 'Clasificando…',
    ja: '分類中…',
    'zh-Hans': '分类中…',
    'zh-Hant': '分類中…',
  }).primary;

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Zap className="w-4 h-4" />
          <span>{thoughts.length} {t({ fr: 'pensées', en: 'thoughts', es: 'pensamientos', ja: '件の思考', 'zh-Hans': '条想法', 'zh-Hant': '條想法' }).primary}</span>
        </div>
      </div>

      {/* Main input area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <h2 className="font-serif text-3xl text-foreground mb-2 text-center">
          {bilingual({ fr: 'Vide-tête', en: 'Brain Dump', es: 'Volcado mental', ja: '脳のメモ', 'zh-Hans': '想法清空', 'zh-Hant': '想法清空' })}
        </h2>
        <p className="text-muted-foreground text-sm mb-8 text-center">
          {t(
            { fr: 'Une pensée à la fois. Appuyez sur Entrée pour sauvegarder.', en: 'One thought at a time. Press Enter to save.', es: 'Un pensamiento a la vez. Presiona Enter para guardar.', ja: '一度に一つの思考を。Enter で保存します。', 'zh-Hans': '一次记一条想法，按 Enter 保存。', 'zh-Hant': '一次記一條想法，按 Enter 儲存。' }
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
            {saving ? '…' : t({ fr: 'Ajouter', en: 'Add', es: 'Agregar', ja: '追加', 'zh-Hans': '添加', 'zh-Hant': '新增' }).primary}
          </Button>
        </div>

        {sessionThoughts.length > 0 && (
          <div className="w-full mt-6">
            <Button
              data-testid="braindump-sort-cta"
              onClick={startSort}
              disabled={!canSort}
              size="full"
              variant="default"
            >
              {classifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {sortingLabel}
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  {sortLabel} ({sessionThoughts.length})
                </>
              )}
            </Button>
            {sortError && (
              <p className="text-destructive text-xs mt-2 text-center" data-testid="braindump-sort-error">
                {sortError}
              </p>
            )}
          </div>
        )}

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
