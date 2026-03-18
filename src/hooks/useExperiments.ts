import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';

export interface Experiment {
  id: string;
  user_id: string;
  action: string;
  duration: string;
  started_at: string;
  ends_at: string;
  status: string;
  reflection_plus: string | null;
  reflection_minus: string | null;
  reflection_next: string | null;
  created_at: string;
}

export interface ExperimentCheckin {
  id: string;
  experiment_id: string;
  date: string;
  showed_up: boolean;
  note: string | null;
  created_at: string;
}

export function useExperiments() {
  const userId = useUserId();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [checkins, setCheckins] = useState<ExperimentCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = useCallback(async () => {
    const { data } = await supabase
      .from('experiments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setExperiments(data);
  }, [userId]);

  const fetchCheckins = useCallback(async (experimentId: string) => {
    const { data } = await supabase
      .from('experiment_checkins')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('date', { ascending: true });
    if (data) setCheckins(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchExperiments().finally(() => setLoading(false));
  }, [fetchExperiments]);

  const activeExperiment = experiments.find(e => e.status === 'active') ?? null;

  // Fetch checkins when active experiment changes
  useEffect(() => {
    if (activeExperiment) {
      fetchCheckins(activeExperiment.id);
    } else {
      setCheckins([]);
    }
  }, [activeExperiment?.id, fetchCheckins]);

  const pastExperiments = experiments.filter(e => e.status !== 'active');

  const isExpired = activeExperiment
    ? new Date(activeExperiment.ends_at) <= new Date()
    : false;

  const daysTotal = activeExperiment
    ? Math.ceil((new Date(activeExperiment.ends_at).getTime() - new Date(activeExperiment.started_at).getTime()) / 86400000)
    : 0;

  const daysElapsed = activeExperiment
    ? Math.min(daysTotal, Math.ceil((Date.now() - new Date(activeExperiment.started_at).getTime()) / 86400000))
    : 0;

  const today = new Date().toISOString().split('T')[0] ?? '';
  const checkedInToday = checkins.some(c => c.date === today && c.showed_up);

  const addExperiment = async (action: string, duration: string, endsAt: Date) => {
    const { data, error } = await supabase
      .from('experiments')
      .insert({
        user_id: userId,
        action,
        duration,
        ends_at: endsAt.toISOString(),
      })
      .select()
      .single();
    if (!error && data) {
      setExperiments(prev => [data, ...prev]);
    }
    return { data, error };
  };

  const checkIn = async (experimentId: string) => {
    const { data, error } = await supabase
      .from('experiment_checkins')
      .insert({
        experiment_id: experimentId,
        date: today,
        showed_up: true,
      })
      .select()
      .single();
    if (!error && data) {
      setCheckins(prev => [...prev, data]);
    }
    return { data, error };
  };

  const completeExperiment = async (
    experimentId: string,
    reflectionPlus: string,
    reflectionMinus: string,
    reflectionNext: string,
  ) => {
    const { error } = await supabase
      .from('experiments')
      .update({
        status: 'completed',
        reflection_plus: reflectionPlus,
        reflection_minus: reflectionMinus,
        reflection_next: reflectionNext,
      })
      .eq('id', experimentId);
    if (!error) {
      await fetchExperiments();
    }
    return { error };
  };

  const pauseExperiment = async (experimentId: string) => {
    const { error } = await supabase
      .from('experiments')
      .update({ status: 'paused' })
      .eq('id', experimentId);
    if (!error) {
      await fetchExperiments();
    }
    return { error };
  };

  const resumeExperiment = async (experimentId: string) => {
    const exp = experiments.find(e => e.id === experimentId);
    if (!exp) return { error: new Error('Experiment not found') };

    const durationDays: Record<string, number> = {
      '1 week': 7, '2 weeks': 14, '1 month': 30,
    };
    const days = durationDays[exp.duration] ?? 7;
    const now = new Date();
    const endsAt = new Date(now);
    endsAt.setDate(endsAt.getDate() + days);

    const { error } = await supabase
      .from('experiments')
      .update({
        status: 'active',
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        reflection_plus: null,
        reflection_minus: null,
        reflection_next: null,
      })
      .eq('id', experimentId);
    if (!error) {
      await fetchExperiments();
    }
    return { error };
  };

  return {
    experiments,
    activeExperiment,
    pastExperiments,
    checkins,
    checkedInToday,
    isExpired,
    daysTotal,
    daysElapsed,
    loading,
    addExperiment,
    checkIn,
    completeExperiment,
    pauseExperiment,
    resumeExperiment,
  };
}
