import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';

export interface TinyStepRecord {
  id: string;
  user_id: string;
  original_step: string;
  final_step: string;
  initial_confidence: number;
  final_confidence: number;
  source: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveTinyStepInput {
  originalStep: string;
  finalStep: string;
  initialConfidence: number;
  finalConfidence: number;
  source?: string;
}

export function useTinySteps() {
  const userId = useUserId();
  const [steps, setSteps] = useState<TinyStepRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSteps = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('tiny_steps')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false });
    if (data) setSteps(data);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchSteps().finally(() => setLoading(false));
  }, [fetchSteps]);

  const saveStep = async (input: SaveTinyStepInput) => {
    const { data, error } = await supabase
      .from('tiny_steps')
      .insert({
        user_id: userId,
        original_step: input.originalStep,
        final_step: input.finalStep,
        initial_confidence: input.initialConfidence,
        final_confidence: input.finalConfidence,
        source: input.source ?? 'home',
      })
      .select()
      .single();
    if (!error && data) setSteps(prev => [data, ...prev]);
    return { data, error };
  };

  /** Steps are archived, never hard-deleted. */
  const archiveStep = async (id: string) => {
    const { error } = await supabase
      .from('tiny_steps')
      .update({ archived: true })
      .eq('id', id);
    if (!error) setSteps(prev => prev.filter(s => s.id !== id));
    return { error };
  };

  return { steps, loading, saveStep, archiveStep, refresh: fetchSteps };
}
