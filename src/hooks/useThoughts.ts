import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';
import { toast } from 'sonner';
import { tickEngagement } from './useEngagement';

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
  const userId = useUserId();

  const fetchThoughts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('user_anonymous_id', userId)
      .eq('archived', false)
      .eq('composted', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setThoughts(data.map(t => ({
        id: t.id,
        content: t.content,
        createdAt: t.created_at,
        aiTheme: t.ai_theme,
        archived: t.archived,
        composted: t.composted,
      })));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts]);

  const addThought = async (content: string): Promise<Thought | null> => {
    const { data, error } = await supabase
      .from('thoughts')
      .insert({ content, user_anonymous_id: userId })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add thought:', error);
      toast.error('Failed to save thought. Please try again.');
      return null;
    }

    const thought: Thought = {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      aiTheme: data.ai_theme,
      archived: data.archived,
      composted: data.composted,
    };
    setThoughts(prev => [thought, ...prev]);
    tickEngagement();

    // Fire-and-forget: generate embedding for the new thought
    supabase.functions.invoke('generate-embedding', {
      body: { thoughtId: data.id, content: data.content },
    }).then(({ error: embedErr }) => {
      if (embedErr) console.warn('Embedding generation failed:', embedErr);
    }).catch((err) => {
      console.warn('Embedding invocation failed:', err);
    });

    return thought;
  };

  const archiveThought = async (id: string) => {
    await supabase.from('thoughts').update({ archived: true }).eq('id', id);
    setThoughts(prev => prev.filter(t => t.id !== id));
  };

  const moveThoughtToTheme = async (id: string, newTheme: string) => {
    await supabase.from('thoughts').update({ ai_theme: newTheme }).eq('id', id);
    setThoughts(prev =>
      prev.map(t => t.id === id ? { ...t, aiTheme: newTheme } : t)
    );
  };

  const retagList = async (list: Thought[]): Promise<number> => {
    let tagged = 0;
    for (const t of list) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-embedding', {
          body: { thoughtId: t.id, content: t.content },
        });
        if (!error && data?.theme) {
          setThoughts(prev =>
            prev.map(th => th.id === t.id ? { ...th, aiTheme: data.theme } : th)
          );
          tagged++;
        }
      } catch (e) {
        console.warn('Retag failed for', t.id, e);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    return tagged;
  };

  const retagUntagged = async (): Promise<number> => {
    return retagList(thoughts.filter(t => !t.aiTheme));
  };

  const retagAll = async (): Promise<number> => {
    return retagList(thoughts);
  };

  return { thoughts, loading, addThought, archiveThought, moveThoughtToTheme, retagUntagged, retagAll, refetch: fetchThoughts };
}
