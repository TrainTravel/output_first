import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClusters } from '@/hooks/useClusters';
import { useThoughts } from '@/hooks/useThoughts';
import { ZenClusterGroup } from './ZenClusterGroup';
import { ZenStone } from './ZenStone';
import { anchorPosition } from './zenPlacement';
import './zen-garden.css';

interface ZenGardenScreenProps {
  onBack: () => void;
}

const MAX_VISIBLE = 3; // Rule C: 3-cluster constraint

export function ZenGardenScreen({ onBack }: ZenGardenScreenProps) {
  const { bilingual, t } = useLanguage();
  const { clusters, loading: clustersLoading, fetchClusterThoughts } = useClusters();
  const { thoughts, loading: thoughtsLoading } = useThoughts();
  const [viewOffset, setViewOffset] = useState(0);

  const loading = clustersLoading || thoughtsLoading;

  // Unclustered thoughts (no cluster assignment) shown as loose stones
  const unclusteredThoughts = thoughts.filter(th => !th.archived && !th.composted);

  // Which clusters are currently visible (sliding window of 3)
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.min(viewOffset, clusters.length - MAX_VISIBLE));
    return { start, end: start + MAX_VISIBLE };
  }, [viewOffset, clusters.length]);

  const canScrollUp = visibleRange.start > 0;
  const canScrollDown = visibleRange.start + MAX_VISIBLE < clusters.length;

  const hasContent = clusters.length > 0 || unclusteredThoughts.length > 0;

  return (
    <div className="zen-garden-bg min-h-screen flex flex-col relative overflow-hidden">
      {/* Header — minimal, lots of Ma */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2 relative z-20">
        <Button variant="ghost" size="sm" onClick={onBack} className="zen-text-muted">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('Retour', 'Back').primary}
        </Button>
        <h1 className="font-serif text-lg zen-text-foreground tracking-wider">
          {bilingual('Jardin Zen', 'Zen Garden')}
        </h1>
        <div className="w-16" />
      </header>

      {/* Breathing prompt */}
      <div className="text-center py-4 relative z-20">
        <p className="zen-text-muted text-sm italic tracking-wide animate-gentle-pulse">
          {t('Respirez… observez les pierres.', 'Breathe… observe the stones.').primary}
        </p>
      </div>

      {/* The Garden — 2D scattered placement */}
      <div className="flex-1 relative" style={{ minHeight: '60vh' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="zen-empty-stone mx-auto animate-gentle-pulse" />
          </div>
        ) : !hasContent ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="zen-empty-stone mx-auto" />
              <p className="zen-text-muted text-sm">
                {t(
                  'Aucune pensée encore. Visitez le Vide-tête pour commencer.',
                  'No thoughts yet. Visit Brain Dump to begin.'
                ).primary}
              </p>
            </div>
          </div>
        ) : clusters.length > 0 ? (
          /* Cluster-based garden */
          <>
            {clusters.map((cluster, i) => (
              <ZenClusterGroup
                key={cluster.id}
                cluster={cluster}
                clusterIndex={i}
                fetchThoughts={fetchClusterThoughts}
                visible={i >= visibleRange.start && i < visibleRange.end}
              />
            ))}
          </>
        ) : (
          /* Unclustered thoughts as loose stones */
          <>
            {unclusteredThoughts.slice(0, 7).map((thought, i) => {
              const pos = anchorPosition(thought.id, i);
              return (
                <div
                  key={thought.id}
                  className="absolute zen-stone-enter"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(${pos.scale})`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                >
                  <ZenStone thought={thought} index={i} />
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Sand scroll navigation — only when clusters > 3 */}
      {clusters.length > MAX_VISIBLE && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewOffset(v => Math.max(0, v - 1))}
            disabled={!canScrollUp}
            className="zen-text-muted opacity-60 hover:opacity-100 transition-opacity"
            aria-label={t('Défiler vers le haut', 'Scroll up').primary}
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewOffset(v => v + 1)}
            disabled={!canScrollDown}
            className="zen-text-muted opacity-60 hover:opacity-100 transition-opacity"
            aria-label={t('Défiler vers le bas', 'Scroll down').primary}
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Footer — cluster/stone count */}
      <footer className="text-center pb-8 pt-4 relative z-20">
        <p className="zen-text-muted text-xs tracking-widest uppercase">
          {clusters.length > 0
            ? `${clusters.length} ${t('groupes', 'clusters').primary}`
            : `${unclusteredThoughts.length} ${t('pierres', 'stones').primary}`
          }
        </p>
      </footer>
    </div>
  );
}
