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
          placeholder={t('Votre réponse...', 'Your answer...', 'Tu respuesta...').primary}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
          autoFocus
        />
        <Button
          variant="accent"
          size="sm"
          onClick={() => { if (answer.trim()) onSubmit(answer.trim()); }}
          disabled={!answer.trim()}
        >
          {t('Ajouter', 'Add', 'Añadir').primary}
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          {t('Passer', 'Skip', 'Saltar').primary}
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
      toast.error(t('Erreur lors du traitement de l\'image', 'Error processing image', 'Error al procesar la imagen').primary);
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
        toast.error((errData as { error?: string }).error || t('Erreur du service IA', 'AI service error', 'Error del servicio IA').primary);
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
            `${data.tasks.length} tâche(s) ajoutée(s)`,
            `${data.tasks.length} task(s) added`,
            `${data.tasks.length} tarea(s) añadida(s)`,
          ).primary,
        );
      } else {
        toast(t('Aucune tâche détectée', 'No tasks detected', 'No se detectaron tareas').primary);
      }

      clearImageState();
    } catch (err) {
      console.error('Image extract error:', err);
      toast.error(t('Erreur lors du traitement', 'Processing error', 'Error de procesamiento').primary);
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
  const priorities: Priority[] = ['A', 'B', 'C'];
  const sectionLabels: Record<Priority, string> = {
    A: t('Urgent + Important', 'Urgent + Important', 'Urgente + Importante').primary,
    B: t('Important', 'Important', 'Importante').primary,
    C: t('Le reste', 'Everything else', 'Todo lo demás').primary,
  };

  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12">
      <div className="w-full max-w-sm space-y-6 animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('Retour', 'Back', 'Volver').primary}
          </Button>
          <h2 className="font-serif text-xl text-foreground">
            {bilingual('Liste A/B/C', 'ABC List', 'Lista A/B/C')}
          </h2>
          <div className="w-16" />
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder={t('Nouvelle tâche...', 'New task...', 'Nueva tarea...').primary}
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
            title={t('Ajouter depuis une image', 'Add from image', 'Añadir desde imagen').primary}
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
          {isEmpty && (
            <p className="text-center text-muted-foreground/60 text-sm italic py-4">
              {t('Aucune tâche — la tête est libre.', 'No tasks — mind is clear.', 'Sin tareas — mente libre.').primary}
            </p>
          )}
          {priorities.map(priority => {
            const sectionItems = items.filter(i => i.priority === priority || (i.pendingAI && priority === 'C'));
            const filtered = priority === 'C'
              ? items.filter(i => i.priority === 'C')
              : sectionItems.filter(i => !i.pendingAI);

            return (
              <div key={priority}>
                <SectionHeader priority={priority} label={sectionLabels[priority]} />
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 italic pl-4 py-1">
                    {t('Vide', 'Empty', 'Vacío').primary}
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
