import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';
import { useTodoList } from '@/hooks/useTodoList';
import type { Quadrant } from '@/types/journal';

export interface QuadrantItem {
  id: string;
  content: string;
  quadrant: Quadrant;
  source: 'thought' | 'todo';
}

export type QuadrantBuckets = Record<Quadrant, QuadrantItem[]>;

const EMPTY_BUCKETS = (): QuadrantBuckets => ({ q1: [], q2: [], q3: [], q4: [] });

/**
 * Reads thoughts (Supabase) and todos (local profile storage) and groups
 * them into the four Eisenhower quadrants. Pure read-only — no AI calls.
 *
 * Heuristic (placeholder, no network):
 * - todos priority A  → q1 (urgent + important)
 * - todos priority B  → q2 (important, not urgent)
 * - todos priority C  → q3 (urgent, not important)
 * - completed todos   → q4 (neither)
 * - thoughts          → q4 (uncategorized, ready to be sorted later)
 */
export function useQuadrants() {
  const userId = useUserId();
  const { items: todos } = useTodoList();
  const [buckets, setBuckets] = useState<QuadrantBuckets>(EMPTY_BUCKETS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const next = EMPTY_BUCKETS();

    for (const t of todos) {
      const q: Quadrant = t.completed
        ? 'q4'
        : t.priority === 'A' ? 'q1'
        : t.priority === 'B' ? 'q2'
        : 'q3';
      next[q].push({ id: `todo-${t.id}`, content: t.text, quadrant: q, source: 'todo' });
    }

    const { data, error } = await supabase
      .from('thoughts')
      .select('id, content')
      .eq('user_anonymous_id', userId)
      .eq('archived', false)
      .eq('composted', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      for (const row of data) {
        next.q4.push({
          id: `thought-${row.id}`,
          content: row.content,
          quadrant: 'q4',
          source: 'thought',
        });
      }
    }

    setBuckets(next);
    setLoading(false);
  }, [userId, todos]);

  useEffect(() => { refresh(); }, [refresh]);

  const totalCount = buckets.q1.length + buckets.q2.length + buckets.q3.length + buckets.q4.length;
  const isEmpty = !loading && totalCount === 0;

  return { buckets, loading, isEmpty, totalCount, refresh };
}
