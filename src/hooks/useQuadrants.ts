import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';
import { useTodoList, type TodoItem, type Priority } from '@/hooks/useTodoList';
import { type Quadrant, QUADRANTS } from '@/types/journal';

export interface QuadrantItem {
  id: string;
  content: string;
  quadrant: Quadrant;
  source: 'thought' | 'todo';
}

export type QuadrantBuckets = Record<Quadrant, QuadrantItem[]>;

// ABC → Eisenhower projection for v1. Lossy but cheap:
// A blends q1+q3 in reality; we send to q1 because A items are by definition consequence-bearing in the ABC framework used in this codebase.
// q3 (urgent, not important) is reachable only via AI Eisenhower classification of brain-dump items.
const ABC_TO_QUADRANT: Record<Priority, Quadrant> = {
  A: 'q1',
  B: 'q2',
  C: 'q4',
};

function emptyBuckets(): QuadrantBuckets {
  return { q1: [], q2: [], q3: [], q4: [] };
}

export function useQuadrants() {
  const [thoughtItems, setThoughtItems] = useState<QuadrantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();
  const { items: todos } = useTodoList();

  const fetchThoughtTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('thoughts')
      .select('id, content, quadrant')
      .eq('user_anonymous_id', userId)
      .eq('archived', false)
      .eq('composted', false)
      .eq('is_task', true)
      .not('quadrant', 'is', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const items: QuadrantItem[] = [];
      for (const row of data) {
        const q = row.quadrant;
        if (q && (QUADRANTS as readonly string[]).includes(q)) {
          items.push({
            id: row.id,
            content: row.content,
            quadrant: q as Quadrant,
            source: 'thought',
          });
        }
      }
      setThoughtItems(items);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchThoughtTasks();
  }, [fetchThoughtTasks]);

  const todoItems = useMemo<QuadrantItem[]>(() => {
    return todos
      .filter((t: TodoItem) => !t.completed)
      .map((t: TodoItem) => ({
        id: t.id,
        content: t.text,
        quadrant: ABC_TO_QUADRANT[t.priority],
        source: 'todo' as const,
      }));
  }, [todos]);

  const buckets = useMemo<QuadrantBuckets>(() => {
    const out = emptyBuckets();
    for (const item of thoughtItems) out[item.quadrant].push(item);
    for (const item of todoItems) out[item.quadrant].push(item);
    return out;
  }, [thoughtItems, todoItems]);

  const totalCount = thoughtItems.length + todoItems.length;
  const isEmpty = totalCount === 0;

  return { buckets, loading, isEmpty, totalCount, refresh: fetchThoughtTasks };
}
