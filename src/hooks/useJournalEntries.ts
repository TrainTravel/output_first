import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from './useUserId';
import { useEffect, useRef } from 'react';

export interface JournalEntryRow {
  id: string;
  user_id: string;
  date: string;
  content: string;
  emotion: string | null;
  emotion_fr: string | null;
  gratitude: string | null;
  created_at: string;
}

const STORAGE_KEY = 'outputfirst_entries';
const MIGRATED_KEY = 'outputfirst_migrated_to_db';

export function useJournalEntries(skip = false) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const migrationRan = useRef(false);

  // Fetch entries from DB
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as JournalEntryRow[];
    },
    enabled: !skip,
  });

  // Auto-migrate localStorage entries once
  useEffect(() => {
    if (migrationRan.current) return;
    if (isLoading) return;
    if (O.isSome(O.fromNullable(localStorage.getItem(MIGRATED_KEY)))) return;

    const storedOpt = pipe(O.fromNullable(localStorage.getItem(STORAGE_KEY)));

    if (O.isNone(storedOpt)) {
      localStorage.setItem(MIGRATED_KEY, 'true');
      return;
    }

    migrationRan.current = true;

    try {
      const parsed = JSON.parse(storedOpt.value) as Array<{
        id: string;
        date: string;
        content: string;
        emotion?: string;
        emotionFr?: string;
        gratitude?: string;
        createdAt: string;
      }>;

      if (parsed.length === 0) {
        localStorage.setItem(MIGRATED_KEY, 'true');
        return;
      }

      // Filter out entries that already exist in DB by date
      const existingDates = new Set(entries.map(e => e.date));
      const toMigrate = parsed.filter(e => !existingDates.has(e.date));

      if (toMigrate.length === 0) {
        localStorage.setItem(MIGRATED_KEY, 'true');
        return;
      }

      const rows = toMigrate.map(e => ({
        user_id: userId,
        date: e.date,
        content: e.content ?? '',
        emotion: e.emotion || null,
        emotion_fr: e.emotionFr || null,
        gratitude: e.gratitude || null,
        created_at: e.createdAt,
      }));

      supabase.from('journal_entries').insert(rows).then(({ error }) => {
        if (!error) {
          localStorage.setItem(MIGRATED_KEY, 'true');
          queryClient.invalidateQueries({ queryKey: ['journal-entries', userId] });
        } else {
          console.error('Migration failed:', error);
          migrationRan.current = false;
        }
      }).then(undefined, (err: unknown) => {
        console.error('Unexpected migration error:', err);
        migrationRan.current = false;
      });
    } catch (e) {
      console.error('Failed to parse localStorage entries for migration:', e);
    }
  }, [isLoading, entries, userId, queryClient]);

  // Save a new entry
  const saveEntry = useMutation({
    mutationFn: async (entry: {
      date: string;
      content: string;
      emotion?: string;
      emotionFr?: string;
      gratitude?: string;
    }) => {
      const { error } = await supabase.from('journal_entries').insert({
        user_id: userId,
        date: entry.date,
        content: entry.content,
        emotion: entry.emotion || null,
        emotion_fr: entry.emotionFr || null,
        gratitude: entry.gratitude || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', userId] });
    },
  });

  return { entries, isLoading, saveEntry };
}
