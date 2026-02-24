import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Sprout, Archive, Trash2, X } from 'lucide-react';
import { useThoughts, Thought } from '@/hooks/useThoughts';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface ThoughtGardenScreenProps {
  onBack: () => void;
}

interface SemanticCluster {
  label: string;
  thoughts: (Thought & { similarity?: number })[];
}

function clusterThoughtsSemantically(
  thoughts: Thought[],
  similarityMap: Map<string, Map<string, number>>,
  threshold = 0.65
): SemanticCluster[] {
  const assigned = new Set<string>();
  const clusters: SemanticCluster[] = [];

  // Sort thoughts by how many similar neighbors they have (hubs first)
  const sorted = [...thoughts].sort((a, b) => {
    const aNeighbors = similarityMap.get(a.id)?.size ?? 0;
    const bNeighbors = similarityMap.get(b.id)?.size ?? 0;
    return bNeighbors - aNeighbors;
  });

  for (const thought of sorted) {
    if (assigned.has(thought.id)) continue;

    const neighbors = similarityMap.get(thought.id);
    const cluster: Thought[] = [thought];
    assigned.add(thought.id);

    if (neighbors) {
      for (const [neighborId, sim] of neighbors) {
        if (!assigned.has(neighborId) && sim >= threshold) {
          const neighbor = thoughts.find(t => t.id === neighborId);
          if (neighbor) {
            cluster.push(neighbor);
            assigned.add(neighborId);
          }
        }
      }
    }

    clusters.push({
      label: thought.aiTheme || thought.content.slice(0, 40) + (thought.content.length > 40 ? '…' : ''),
      thoughts: cluster,
    });
  }

  return clusters;
}

export function ThoughtGardenScreen({ onBack }: ThoughtGardenScreenProps) {
  const { bilingual, isFr } = useLanguage();
  const { thoughts, loading, archiveThought } = useThoughts();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [similarityMap, setSimilarityMap] = useState<Map<string, Map<string, number>>>(new Map());
  const [clusteringDone, setClusteringDone] = useState(false);

  // Build similarity map by querying match_thoughts for each thought with an embedding
  const buildSimilarityMap = useCallback(async () => {
    if (thoughts.length === 0) {
      setClusteringDone(true);
      return;
    }

    const map = new Map<string, Map<string, number>>();
    const anonId = localStorage.getItem('outputfirst_anon_id') || '';

    // For each thought, find its similar neighbors
    // We batch by picking a representative subset to avoid too many RPC calls
    const thoughtsToQuery = thoughts.slice(0, 50); // limit to 50 for perf

    for (const thought of thoughtsToQuery) {
      try {
        // Get the embedding for this thought first
        const { data: thoughtData } = await supabase
          .from('thoughts')
          .select('embedding')
          .eq('id', thought.id)
          .single();

        if (!thoughtData?.embedding) continue;

        const { data: matches, error } = await supabase.rpc('match_thoughts', {
          query_embedding: thoughtData.embedding,
          similarity_threshold: 0.5,
          match_count: 10,
          p_user_anonymous_id: anonId,
        });

        if (error || !matches) continue;

        const neighbors = new Map<string, number>();
        for (const match of matches) {
          if (match.id !== thought.id) {
            neighbors.set(match.id, match.similarity);

            // Also add reverse mapping
            if (!map.has(match.id)) map.set(match.id, new Map());
            map.get(match.id)!.set(thought.id, match.similarity);
          }
        }
        map.set(thought.id, neighbors);
      } catch (e) {
        console.warn('Similarity query failed for thought', thought.id, e);
      }
    }

    setSimilarityMap(map);
    setClusteringDone(true);
  }, [thoughts]);

  useEffect(() => {
    if (!loading && thoughts.length > 0) {
      buildSimilarityMap();
    } else if (!loading) {
      setClusteringDone(true);
    }
  }, [loading, thoughts.length, buildSimilarityMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return thoughts;
    const q = search.toLowerCase();
    return thoughts.filter(
      t => t.content.toLowerCase().includes(q) || (t.aiTheme && t.aiTheme.toLowerCase().includes(q))
    );
  }, [thoughts, search]);

  // Semantic clusters
  const clusters = useMemo(() => {
    if (!clusteringDone || filtered.length === 0) return [];
    return clusterThoughtsSemantically(filtered, similarityMap);
  }, [filtered, similarityMap, clusteringDone]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const archiveSelected = async () => {
    for (const id of selectedIds) {
      await archiveThought(id);
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {bilingual('Retour', 'Back')}
        </Button>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={archiveSelected}>
              <Archive className="w-4 h-4 mr-1" />
              {bilingual('Archiver', 'Archive')} ({selectedIds.size})
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(s => !s)}>
            {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl text-foreground flex items-center justify-center gap-2">
          <Sprout className="w-7 h-7 text-primary" />
          {bilingual('Jardin de pensées', 'Thought Garden')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {bilingual(
            `${thoughts.length} pensées capturées`,
            `${thoughts.length} thoughts captured`
          )}
          {clusteringDone && clusters.length > 1 && (
            <span className="ml-1">
              · {clusters.length} {bilingual('groupes', 'clusters')}
            </span>
          )}
        </p>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="max-w-lg mx-auto w-full mb-6 animate-fade-in-up">
          <Input
            placeholder={bilingual('Rechercher…', 'Search…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {loading || !clusteringDone ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground animate-gentle-pulse">
              {!clusteringDone && !loading
                ? bilingual('Regroupement en cours…', 'Clustering thoughts…')
                : bilingual('Chargement…', 'Loading…')}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sprout className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search
                ? bilingual('Aucun résultat trouvé.', 'No results found.')
                : bilingual(
                    'Votre jardin est vide. Commencez par un vide-tête !',
                    'Your garden is empty. Start with a brain dump!'
                  )}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {clusters.map((cluster, idx) => (
              <div key={idx} className="animate-fade-in-up">
                {clusters.length > 1 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 mb-4">
                    <h3 className="font-serif text-lg font-semibold text-foreground tracking-tight">
                      {cluster.label}
                      <span className="text-muted-foreground ml-2 text-sm font-sans font-normal">
                        ({cluster.thoughts.length})
                      </span>
                    </h3>
                  </div>
                )}
                <div className="space-y-2">
                  {cluster.thoughts.map(t => (
                    <ThoughtCard
                      key={t.id}
                      content={t.content}
                      date={t.createdAt}
                      selected={selectedIds.has(t.id)}
                      onToggle={() => toggleSelect(t.id)}
                      onArchive={() => archiveThought(t.id)}
                      isFr={isFr}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThoughtCard({
  content,
  date,
  selected,
  onToggle,
  onArchive,
  isFr,
}: {
  content: string;
  date: string;
  selected: boolean;
  onToggle: () => void;
  onArchive: () => void;
  isFr: boolean;
}) {
  const formatted = new Date(date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      onClick={onToggle}
      className={`
        group relative bg-card border rounded-xl px-4 py-3 cursor-pointer transition-all
        ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}
      `}
    >
      <p className="text-foreground text-sm leading-relaxed pr-8">{content}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{formatted}</span>
        <button
          onClick={e => {
            e.stopPropagation();
            onArchive();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          aria-label="Archive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
