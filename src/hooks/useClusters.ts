import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserId } from '@/hooks/useUserId';

export interface Cluster {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  thoughtCount?: number;
}

export interface ClusterThought {
  id: string;
  content: string;
  createdAt: string;
  aiTheme: string | null;
}

export function useClusters() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useUserId();

  const fetchClusters = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('clusters')
      .select('*, cluster_thoughts(thought_id)')
      .eq('user_anonymous_id', userId)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setClusters(data.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        status: c.status,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        thoughtCount: (c.cluster_thoughts as any[])?.length ?? 0,
      })));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const fetchClusterThoughts = async (clusterId: string): Promise<ClusterThought[]> => {
    const { data, error } = await supabase
      .from('cluster_thoughts')
      .select('thought_id, thoughts(id, content, created_at, ai_theme)')
      .eq('cluster_id', clusterId);

    if (error || !data) return [];

    return data
      .map((ct: any) => ct.thoughts)
      .filter(Boolean)
      .map((t: any) => ({
        id: t.id,
        content: t.content,
        createdAt: t.created_at,
        aiTheme: t.ai_theme,
      }));
  };

  const createCluster = async (title: string, description?: string): Promise<Cluster | null> => {
    // Check for existing cluster with same title (case-insensitive)
    const existing = clusters.find(c => c.title.toLowerCase() === title.trim().toLowerCase());
    if (existing) return existing;

    const { data, error } = await supabase
      .from('clusters')
      .insert({ title: title.trim(), description: description || '', user_anonymous_id: userId })
      .select()
      .single();

    if (error || !data) return null;

    const cluster: Cluster = {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      thoughtCount: 0,
    };
    setClusters(prev => [cluster, ...prev]);
    return cluster;
  };

  const updateCluster = async (id: string, updates: { title?: string; description?: string }) => {
    await supabase.from('clusters').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    setClusters(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
  };

  const addThoughtToCluster = async (clusterId: string, thoughtId: string) => {
    const { error } = await supabase
      .from('cluster_thoughts')
      .insert({ cluster_id: clusterId, thought_id: thoughtId });

    if (!error) {
      setClusters(prev => prev.map(c =>
        c.id === clusterId ? { ...c, thoughtCount: (c.thoughtCount ?? 0) + 1 } : c
      ));
    }
  };

  const removeThoughtFromCluster = async (clusterId: string, thoughtId: string) => {
    await supabase
      .from('cluster_thoughts')
      .delete()
      .eq('cluster_id', clusterId)
      .eq('thought_id', thoughtId);

    setClusters(prev => prev.map(c =>
      c.id === clusterId ? { ...c, thoughtCount: Math.max(0, (c.thoughtCount ?? 1) - 1) } : c
    ));
  };

  return {
    clusters,
    loading,
    fetchClusters,
    fetchClusterThoughts,
    createCluster,
    updateCluster,
    addThoughtToCluster,
    removeThoughtFromCluster,
  };
}
