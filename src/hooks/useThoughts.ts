import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ANON_ID_KEY = 'outputfirst_anon_id';

function getAnonId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export interface Thought {
  id: string;
  content: string;
  createdAt: string;
  aiTheme: string | null;
  archived: boolean;
  composted: boolean;
}

export function useThoughts() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const anonId = getAnonId();

  const fetchThoughts = useCallback(async () => {
    setLoading(true);
    // Use compost_and_fetch_thoughts RPC which auto-composts old unlinked thoughts
    const { data, error } = await supabase.rpc('compost_and_fetch_thoughts', {
      p_user_anonymous_id: anonId,
    });

    if (!error && data) {
      setThoughts((data as any[]).map(t => ({
        id: t.id,
        content: t.content,
        createdAt: t.created_at,
        aiTheme: t.ai_theme,
        archived: t.archived,
        composted: t.composted,
      })));
    }
    setLoading(false);
  }, [anonId]);

  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts]);

  const addThought = async (content: string): Promise<Thought | null> => {
    const { data, error } = await supabase
      .from('thoughts')
      .insert({ content, user_anonymous_id: anonId })
      .select()
      .single();

    if (error || !data) return null;

    const thought: Thought = {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      aiTheme: data.ai_theme,
      archived: data.archived,
      composted: data.composted,
    };
    setThoughts(prev => [thought, ...prev]);

    // Fire-and-forget: generate embedding for the new thought
    supabase.functions.invoke('generate-embedding', {
      body: { thoughtId: data.id, content: data.content },
    }).then(({ error: embedErr }) => {
      if (embedErr) console.warn('Embedding generation failed:', embedErr);
    });

    return thought;
  };

  const archiveThought = async (id: string) => {
    await supabase.from('thoughts').update({ archived: true }).eq('id', id);
    setThoughts(prev => prev.filter(t => t.id !== id));
  };

  return { thoughts, loading, addThought, archiveThought, refetch: fetchThoughts };
}
