import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Trash2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useTodoList, Priority, TodoItem } from '@/hooks/useTodoList';

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

function PriorityBadge({
  item,
  onCycle,
}: {
  item: TodoItem;
  onCycle: () => void;
}) {
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
    <div className={`flex items-center gap-2 pt-4 pb-1`}>
      <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
      <span className={`text-xs font-semibold uppercase tracking-wide ${styles.header}`}>
        {priority} — {label}
      </span>
    </div>
  );
}

export function TodoListScreen({ onBack }: TodoListScreenProps) {
  const { t, bilingual, lang } = useLanguage();
  const { items, addItem, resolveAI, setPriority, toggleComplete, deleteItem } = useTodoList();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    inputRef.current?.focus();

    const id = addItem(text);

    // Fire AI triage in background
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/todo-triage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            task: text,
            existingTasks: items
              .filter(i => !i.pendingAI)
              .map(i => ({ text: i.text, priority: i.priority })),
            lang,
          }),
        }
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

        {/* Input */}
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

        {/* Task sections — always rendered */}
        <div className="space-y-1">
          {isEmpty && (
            <p className="text-center text-muted-foreground/60 text-sm italic py-4">
              {t('Aucune tâche — la tête est libre.', 'No tasks — mind is clear.', 'Sin tareas — mente libre.').primary}
            </p>
          )}
          {priorities.map(priority => {
            const sectionItems = items.filter(i => i.priority === priority || (i.pendingAI && priority === 'C'));
            // Deduplicate: pendingAI items already in C section, skip in others
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
                        {/* Checkbox */}
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

                        {/* Text */}
                        <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
                          {item.text}
                        </span>

                        {/* Priority badge */}
                        <PriorityBadge
                          item={item}
                          onCycle={() => {
                            if (!item.pendingAI) setPriority(item.id, PRIORITY_CYCLE[item.priority]);
                          }}
                        />

                        {/* Delete */}
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
