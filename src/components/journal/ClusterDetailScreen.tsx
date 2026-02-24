import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers, FileText } from 'lucide-react';
import { useClusters, ClusterThought } from '@/hooks/useClusters';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClusterDetailScreenProps {
  clusterId: string;
  onBack: () => void;
}

export function ClusterDetailScreen({ clusterId, onBack }: ClusterDetailScreenProps) {
  const { bilingual, isFr } = useLanguage();
  const { clusters, fetchClusterThoughts } = useClusters();
  const [thoughts, setThoughts] = useState<ClusterThought[]>([]);
  const [loading, setLoading] = useState(true);

  const cluster = clusters.find(c => c.id === clusterId);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchClusterThoughts(clusterId);
      setThoughts(data);
      setLoading(false);
    };
    load();
  }, [clusterId]);

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {bilingual('Retour', 'Back')}
        </Button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl text-foreground flex items-center justify-center gap-2">
          <Layers className="w-7 h-7 text-primary" />
          {cluster?.title ?? bilingual('Cluster', 'Cluster')}
        </h2>
        {cluster?.description && (
          <p className="text-muted-foreground text-sm mt-1">{cluster.description}</p>
        )}
      </div>

      {/* Linked thoughts */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {bilingual('Pensées liées', 'Linked Thoughts')}
          <span className="ml-2 lowercase font-normal">({thoughts.length})</span>
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground animate-gentle-pulse">
              {bilingual('Chargement…', 'Loading…')}
            </p>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {bilingual(
                'Aucune pensée liée pour le moment.',
                'No linked thoughts yet.'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {thoughts.map(t => {
              const formatted = new Date(t.createdAt).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={t.id}
                  className="bg-card border border-border rounded-xl px-4 py-3 animate-fade-in-up"
                >
                  <p className="text-foreground text-sm leading-relaxed">{t.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {t.aiTheme && (
                      <span className="text-xs text-primary">{t.aiTheme}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Generate Proposal button */}
        <div className="mt-8 text-center">
          <Button variant="outline" size="full" disabled>
            <FileText className="w-4 h-4 mr-2" />
            {bilingual('Générer une proposition', 'Generate Proposal')}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {bilingual('Bientôt disponible', 'Coming soon')}
          </p>
        </div>
      </div>
    </div>
  );
}
