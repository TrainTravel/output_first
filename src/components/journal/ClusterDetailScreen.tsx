import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers, FileText, MessageCircle } from 'lucide-react';
import { useClusters, ClusterThought } from '@/hooks/useClusters';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThoughtContext } from '@/types/chat';

interface ClusterDetailScreenProps {
  clusterId: string;
  onBack: () => void;
  onOpenChatWithContext: (context: ThoughtContext) => void;
}

export function ClusterDetailScreen({ clusterId, onBack, onOpenChatWithContext }: ClusterDetailScreenProps) {
  const { bilingual, t, targetLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
  const { clusters, fetchClusterThoughts } = useClusters();
  const [thoughts, setThoughts] = useState<ClusterThought[]>([]);
  const [loading, setLoading] = useState(true);

  const cluster = clusters.find(c => c.id === clusterId);
  const dateLocale = isFr ? 'fr-FR' : isEs ? 'es-ES' : 'en-US';

  const handleChatCluster = () => {
    const context: ThoughtContext = {
      mode: 'cluster',
      label: cluster?.title ?? bilingual('Cluster', 'Cluster', 'Grupo'),
      thoughts: thoughts.slice(0, 20).map(th => ({
        content: th.content,
        createdAt: th.createdAt,
        aiTheme: th.aiTheme ?? null,
      })),
      clusterDescription: cluster?.description,
    };
    onOpenChatWithContext(context);
  };

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
          {t('Retour', 'Back', 'Volver').primary}
        </Button>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl text-foreground flex items-center justify-center gap-2">
          <Layers className="w-7 h-7 text-primary" />
          {cluster?.title ?? bilingual('Cluster', 'Cluster', 'Grupo')}
        </h2>
        {cluster?.description && (
          <p className="text-muted-foreground text-sm mt-1">{cluster.description}</p>
        )}
      </div>

      {/* Linked thoughts */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {bilingual('Pensées liées', 'Linked Thoughts', 'Pensamientos vinculados')}
          <span className="ml-2 lowercase font-normal">({thoughts.length})</span>
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground animate-gentle-pulse">
              {t('Chargement…', 'Loading…', 'Cargando…').primary}
            </p>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {t(
                'Aucune pensée liée pour le moment.',
                'No linked thoughts yet.',
                'Aún no hay pensamientos vinculados.'
              ).primary}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {thoughts.map(th => {
              const formatted = new Date(th.createdAt).toLocaleDateString(dateLocale, {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div
                  key={th.id}
                  className="bg-card border border-border rounded-xl px-4 py-3 animate-fade-in-up"
                >
                  <p className="text-foreground text-sm leading-relaxed">{th.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {th.aiTheme && (
                      <span className="text-xs text-primary">{th.aiTheme}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Discuss cluster button */}
        {thoughts.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="default" size="full" onClick={handleChatCluster} className="whitespace-normal h-auto min-h-[3.5rem] py-3">
              <MessageCircle className="w-4 h-4 mr-2" />
              {bilingual('Discuter ce cluster', 'Discuss this cluster', 'Discutir este grupo')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
