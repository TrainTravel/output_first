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
  const anonId = getAnonId();

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clusters')
      .select('*')
      .eq('user_anonymous_id', anonId)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      // Get thought counts for each cluster
      const clustersWithCounts = await Promise.all(
        data.map(async (c) => {
          const { count } = await supabase
            .from('cluster_thoughts')
            .select('*', { count: 'exact', head: true })
            .eq('cluster_id', c.id);

          return {
            id: c.id,
            title: c.title,
            description: c.description,
            status: c.status,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            thoughtCount: count ?? 0,
          };
        })
      );
      setClusters(clustersWithCounts);
    }
    setLoading(false);
  }, [anonId]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const fetchClusterThoughts = async (clusterId: string): Promise<ClusterThought[]> => {
    const { data, error } = await supabase
      .from('cluster_thoughts')
      .select('thought_id')
      .eq('cluster_id', clusterId);

    if (error || !data || data.length === 0) return [];

    const thoughtIds = data.map(ct => ct.thought_id);
    const { data: thoughts, error: tError } = await supabase
      .from('thoughts')
      .select('*')
      .in('id', thoughtIds)
      .order('created_at', { ascending: false });

    if (tError || !thoughts) return [];

    return thoughts.map(t => ({
      id: t.id,
      content: t.content,
      createdAt: t.created_at,
      aiTheme: t.ai_theme,
    }));
  };

  const createCluster = async (title: string, description?: string): Promise<Cluster | null> => {
    const { data, error } = await supabase
      .from('clusters')
      .insert({ title, description: description || '', user_anonymous_id: anonId })
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

  const addThoughtToCluster = async (clusterId: string, thoughtId: string) => {
    await supabase.from('cluster_thoughts').insert({ cluster_id: clusterId, thought_id: thoughtId });
  };

  const removeThoughtFromCluster = async (clusterId: string, thoughtId: string) => {
    await supabase
      .from('cluster_thoughts')
      .delete()
      .eq('cluster_id', clusterId)
      .eq('thought_id', thoughtId);
  };

  return {
    clusters,
    loading,
    fetchClusters,
    fetchClusterThoughts,
    createCluster,
    addThoughtToCluster,
    removeThoughtFromCluster,
  };
}
