import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Trash2, Sparkles, Camera, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useTodoList, Priority, TodoItem } from '@/hooks/useTodoList';
import { toast } from 'sonner';

interface TodoListScreenProps {
  onBack: () => void;
}

const PRIORITY_CYCLE: Record<Priority, Priority> = { A: 'B', B: 'C', C: 'A' };

type ListMode = 'focus' | 'all';

// Bailey ABC Step 3: in Focus mode, hide the master list entirely.
// `pendingAI` items are excluded — their priority isn't decided yet, so they
// can't be "urgent" from the user's perspective.
export function filterByMode(items: TodoItem[], mode: ListMode): TodoItem[] {
  if (mode === 'all') return items;
  return items.filter(item => item.priority === 'A' && !item.pendingAI);
}

const PRIORITY_STYLES: Record<Priority, { badge: string; dot: string; header: string }> = {
  A: {
    badge: 'bg-[hsl(var(--accent))] text-accent-foreground',
    dot: 'bg-[hsl(var(--accent))]',
    header: 'text-[hsl(var(--accent))]',
  },
  B: {
    badge: 'bg-primary text-primary-foreground',
    dot: 'bg-primary',
    header: 'text-primary',
  },
  C: {
    badge: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/40',
    header: 'text-muted-foreground',
  },
};

// --- Sub-components ---

function PriorityBadge({ item, onCycle }: { item: TodoItem; onCycle: () => void }) {
  const styles = PRIORITY_STYLES[item.priority];
  return (
    <button
      onClick={onCycle}
      title={item.aiReason || undefined}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition-all hover:opacity-80 ${styles.badge}`}
    >
      {item.pendingAI ? (
        <span className="flex gap-0.5 items-center">
          <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      ) : (
        <>
          {item.priority}
          {item.aiReason && <Sparkles className="w-2.5 h-2.5 opacity-70" />}
        </>
      )}
    </button>
  );
}

function SectionHeader({ priority, label }: { priority: Priority; label: string }) {
  const styles = PRIORITY_STYLES[priority];
  return (
    <div className="flex items-center gap-2 pt-4 pb-1">
      <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
      <span className={`text-xs font-semibold uppercase tracking-wide ${styles.header}`}>
        {priority} — {label}
      </span>
    </div>
  );
}

function ClarificationCard({
  question,
  onSubmit,
  onSkip,
  t,
}: {
  question: string;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-fade-in-up">
      <p className="text-sm text-muted-foreground">{question}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && answer.trim()) onSubmit(answer.trim()); }}
          placeholder={t({ fr: 'Votre réponse...', en: 'Your answer...', es: 'Tu respuesta...', ja: 'あなたの答え...', 'zh-Hans': '你的回答...', 'zh-Hant': '你的回答...' }).primary}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          autoFocus
        />
        <Button
          variant="accent"
          size="sm"
          onClick={() => { if (answer.trim()) onSubmit(answer.trim()); }}
          disabled={!answer.trim()}
        >
          {t({ fr: 'Ajouter', en: 'Add', es: 'Añadir', ja: '追加', 'zh-Hans': '添加', 'zh-Hant': '新增' }).primary}
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          {t({ fr: 'Passer', en: 'Skip', es: 'Saltar', ja: 'スキップ', 'zh-Hans': '跳过', 'zh-Hant': '跳過' }).primary}
        </Button>
      </div>
    </div>
  );
}

// --- Main component ---

export function TodoListScreen({ onBack }: TodoListScreenProps) {
  const { t, bilingual, targetLang, primaryLang } = useLanguage();
  const { items, addItem, resolveAI, setPriority, toggleComplete, deleteItem } = useTodoList();
  const [inputValue, setInputValue] = useState('');
  // Intentionally session-local, not persisted: each visit starts in Focus
  // mode so the protective default is automatic (Bailey ABC Step 3).
  const [mode, setMode] = useState<ListMode>('focus');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image upload state
  const [imageProcessing, setImageProcessing] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [pendingMimeType, setPendingMimeType] = useState<string | null>(null);

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  };

  // --- Text task add (existing) ---
  const handleAdd = async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    inputRef.current?.focus();
    const id = addItem(text);
    fireTriageInBackground(id, text);
  };

  const fireTriageInBackground = async (id: string, text: string) => {
    try {
      const authToken = await getAuthHeader();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/todo-triage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({
            task: text,
            existingTasks: items.filter(i => !i.pendingAI).map(i => ({ text: i.text, priority: i.priority })),
            lang: targetLang,
            primaryLang,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json() as { priority: Priority; reason: string };
        resolveAI(id, data.priority, data.reason ?? '');
      } else {
        resolveAI(id, 'C', '');
      }
    } catch {
      resolveAI(id, 'C', '');
    }
  };

  // --- Image upload flow ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset file input so re-selecting the same file works
    e.target.value = '';

    setImageProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      await callImageExtract(base64, file.type);
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(t({ fr: 'Erreur lors du traitement de l\'image', en: 'Error processing image', es: 'Error al procesar la imagen', ja: '画像の処理中にエラーが発生しました', 'zh-Hans': '处理图片时出错', 'zh-Hant': '處理圖片時出錯' }).primary);
      setImageProcessing(false);
    }
  };

  const callImageExtract = async (imageBase64: string, mimeType: string, clarification?: string) => {
    setImageProcessing(true);
    try {
      const authToken = await getAuthHeader();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/todo-from-image`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ imageBase64, mimeType, lang: targetLang, primaryLang, clarification }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error((errData as { error?: string }).error || t({ fr: 'Erreur du service IA', en: 'AI service error', es: 'Error del servicio IA', ja: 'AIサービスのエラー', 'zh-Hans': 'AI 服务出错', 'zh-Hant': 'AI 服務出錯' }).primary);
        setImageProcessing(false);
        return;
      }

      const data = await res.json() as { tasks?: string[]; question?: string };

      if (data.question) {
        // AI needs clarification
        setClarificationQuestion(data.question);
        setPendingImageBase64(imageBase64);
        setPendingMimeType(mimeType);
        setImageProcessing(false);
        return;
      }

      if (data.tasks?.length) {
        for (const taskText of data.tasks) {
          const id = addItem(taskText);
          fireTriageInBackground(id, taskText);
        }
        toast.success(
          t(
            { fr: `${data.tasks.length} tâche(s) ajoutée(s)`, en: `${data.tasks.length} task(s) added`, es: `${data.tasks.length} tarea(s) añadida(s)`, ja: `${data.tasks.length}件のタスクを追加しました`, 'zh-Hans': `已添加 ${data.tasks.length} 项任务`, 'zh-Hant': `已新增 ${data.tasks.length} 項任務` },
          ).primary,
        );
      } else {
        toast(t({ fr: 'Aucune tâche détectée', en: 'No tasks detected', es: 'No se detectaron tareas', ja: 'タスクは検出されませんでした', 'zh-Hans': '未识别到任务', 'zh-Hant': '未識別到任務' }).primary);
      }

      clearImageState();
    } catch (err) {
      console.error('Image extract error:', err);
      toast.error(t({ fr: 'Erreur lors du traitement', en: 'Processing error', es: 'Error de procesamiento', ja: '処理中にエラーが発生しました', 'zh-Hans': '处理时出错', 'zh-Hant': '處理時出錯' }).primary);
      setImageProcessing(false);
    }
  };

  const handleClarificationSubmit = (answer: string) => {
    if (pendingImageBase64 && pendingMimeType) {
      callImageExtract(pendingImageBase64, pendingMimeType, answer);
      setClarificationQuestion(null);
    }
  };

  const clearImageState = () => {
    setImageProcessing(false);
    setClarificationQuestion(null);
    setPendingImageBase64(null);
    setPendingMimeType(null);
  };

  // --- Render helpers ---
  const sectionLabels: Record<Priority, string> = {
    A: t({ fr: 'Urgent + Important', en: 'Urgent + Important', es: 'Urgente + Importante', ja: '緊急 ＋ 重要', 'zh-Hans': '紧急 + 重要', 'zh-Hant': '緊急 + 重要' }).primary,
    B: t({ fr: 'Important', en: 'Important', es: 'Importante', ja: '重要', 'zh-Hans': '重要', 'zh-Hant': '重要' }).primary,
    C: t({ fr: 'Le reste', en: 'Everything else', es: 'Todo lo demás', ja: 'その他', 'zh-Hans': '其他', 'zh-Hant': '其他' }).primary,
  };

  const visibleItems = filterByMode(items, mode);
  const isFocusEmpty = mode === 'focus' && visibleItems.length === 0;
  const isAllEmpty = mode === 'all' && items.length === 0;
  const sectionPriorities: Priority[] = mode === 'focus' ? ['A'] : ['A', 'B', 'C'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}
          </Button>
          <h2 className="font-serif text-xl text-foreground">
            {bilingual({ fr: 'Liste A/B/C', en: 'ABC List', es: 'Lista A/B/C', ja: 'A/B/C リスト', 'zh-Hans': 'A/B/C 清单', 'zh-Hant': 'A/B/C 清單' })}
          </h2>
          <div className="w-16" />
        </div>

        {/* Focus / All mode toggle (Bailey ABC Step 3) */}
        <div
          data-testid="abc-mode-toggle"
          role="group"
          aria-label={t({ fr: 'Mode de la liste', en: 'List mode', es: 'Modo de la lista', ja: 'リストモード', 'zh-Hans': '清单模式', 'zh-Hant': '清單模式' }).primary}
          className="flex justify-center gap-0 rounded-full bg-muted/40 p-1 mx-auto w-fit"
        >
          {(['focus', 'all'] as const).map(m => {
            const isActive = mode === m;
            const label = m === 'focus'
              ? t({ fr: 'Focus', en: 'Focus', es: 'Foco', ja: '集中', 'zh-Hans': '专注', 'zh-Hant': '專注' }).primary
              : t({ fr: 'Tout', en: 'All', es: 'Todo', ja: 'すべて', 'zh-Hans': '全部', 'zh-Hant': '全部' }).primary;
            return (
              <button
                key={m}
                type="button"
                data-testid={`abc-mode-${m}`}
                aria-pressed={isActive}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder={t({ fr: 'Nouvelle tâche...', en: 'New task...', es: 'Nueva tarea...', ja: '新しいタスク...', 'zh-Hans': '新任务...', 'zh-Hant': '新任務...' }).primary}
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
            autoFocus
          />
          {/* Camera button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageProcessing}
            className="h-12 w-12 rounded-xl flex-shrink-0"
            title={t({ fr: 'Ajouter depuis une image', en: 'Add from image', es: 'Añadir desde imagen', ja: '画像から追加', 'zh-Hans': '从图片添加', 'zh-Hant': '從圖片新增' }).primary}
          >
            {imageProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {/* Submit button */}
          <Button
            variant="accent"
            size="icon"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="h-12 w-12 rounded-xl flex-shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Clarification card */}
        {clarificationQuestion && (
          <ClarificationCard
            question={clarificationQuestion}
            onSubmit={handleClarificationSubmit}
            onSkip={clearImageState}
            t={t}
          />
        )}

        {/* Task sections */}
        <div className="space-y-1">
          {isAllEmpty && (
            <p className="text-center text-muted-foreground/60 text-sm italic py-4">
              {t({ fr: 'Aucune tâche — la tête est libre.', en: 'No tasks — mind is clear.', es: 'Sin tareas — mente libre.', ja: 'タスクなし — 頭はすっきりしています。', 'zh-Hans': '没有任务 — 思绪清明。', 'zh-Hant': '沒有任務 — 思緒清明。' }).primary}
            </p>
          )}
          {isFocusEmpty && !isAllEmpty && (
            <p
              data-testid="abc-focus-empty"
              className="text-center text-muted-foreground/60 text-sm italic py-4"
            >
              {t({ fr: "Rien d'urgent aujourd'hui. Respire.", en: 'Nothing urgent today. Breathe.', es: 'Nada urgente hoy. Respira.', ja: '今日(きょう)は緊急(きんきゅう)なものはありません。深呼吸(しんこきゅう)を。', 'zh-Hans': '今天没有紧急的事。深呼吸。', 'zh-Hant': '今天沒有緊急的事。深呼吸。' }).primary}
            </p>
          )}
          {sectionPriorities.map(priority => {
            const sectionItems = items.filter(i => i.priority === priority || (i.pendingAI && priority === 'C'));
            const filtered = priority === 'C'
              ? items.filter(i => i.priority === 'C')
              : sectionItems.filter(i => !i.pendingAI);

            return (
              <div key={priority}>
                <SectionHeader priority={priority} label={sectionLabels[priority]} />
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 italic pl-4 py-1">
                    {t({ fr: 'Vide', en: 'Empty', es: 'Vacío', ja: '空', 'zh-Hans': '空', 'zh-Hant': '空' }).primary}
                  </p>
                ) : (
                  <ul className="space-y-1 mt-1">
                    {filtered.map(item => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border group animate-fade-in-up"
                      >
                        <button
                          onClick={() => toggleComplete(item.id)}
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                            item.completed
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground/40 hover:border-primary/60'
                          }`}
                        >
                          {item.completed && (
                            <svg viewBox="0 0 10 10" className="w-full h-full p-0.5">
                              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
                          {item.text}
                        </span>
                        <PriorityBadge
                          item={item}
                          onCycle={() => {
                            if (!item.pendingAI) setPriority(item.id, PRIORITY_CYCLE[item.priority]);
                          }}
                        />
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// --- Utilities ---

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
