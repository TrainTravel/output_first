import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Layers, X } from 'lucide-react';
import { useClusters, Cluster } from '@/hooks/useClusters';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClustersScreenProps {
  onBack: () => void;
  onOpenCluster: (clusterId: string) => void;
}

export function ClustersScreen({ onBack, onOpenCluster }: ClustersScreenProps) {
  const { bilingual, t, targetLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
  const { clusters, loading, createCluster } = useClusters();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const dateLocale = isFr ? 'fr-FR' : isEs ? 'es-ES' : 'en-US';

  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    await createCluster(trimmed);
    setCreating(false);
    setNewTitle('');
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t({ fr: 'Retour', en: 'Back', es: 'Volver' }).primary}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreate(s => !s)}
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl text-foreground flex items-center justify-center gap-2">
          <Layers className="w-7 h-7 text-primary" />
          {bilingual({ fr: 'Mes Clusters', en: 'My Clusters', es: 'Mis Grupos' })}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t(
            { fr: 'Regroupez vos pensées librement.', en: 'Group your thoughts freely.', es: 'Agrupa tus pensamientos libremente.' }
          ).primary}
        </p>
      </div>

      {/* Create new cluster */}
      {showCreate && (
        <div className="max-w-lg mx-auto w-full mb-6 animate-fade-in-up">
          <div className="flex gap-2">
            <Input
              placeholder={t({ fr: 'Nom du cluster…', en: 'Cluster name…', es: 'Nombre del grupo…' }).primary}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <Button onClick={handleCreate} disabled={!newTitle.trim() || creating} size="sm">
              {creating ? '…' : t({ fr: 'Créer', en: 'Create', es: 'Crear' }).primary}
            </Button>
          </div>
        </div>
      )}

      {/* Cluster list */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground animate-gentle-pulse">
              {t({ fr: 'Chargement…', en: 'Loading…', es: 'Cargando…' }).primary}
            </p>
          </div>
        ) : clusters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {t(
                { fr: 'Pas encore de clusters. Créez-en un pour regrouper vos pensées.', en: 'No clusters yet. Create one to group your thoughts.', es: 'Aún no hay grupos. Crea uno para agrupar tus pensamientos.' }
              ).primary}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clusters.map(cluster => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                onClick={() => onOpenCluster(cluster.id)}
                dateLocale={dateLocale}
                thoughtsLabel={isFr ? 'pensées' : isEs ? 'pensamientos' : 'thoughts'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClusterCard({
  cluster,
  onClick,
  dateLocale,
  thoughtsLabel,
}: {
  cluster: Cluster;
  onClick: () => void;
  dateLocale: string;
  thoughtsLabel: string;
}) {
  const formatted = new Date(cluster.updatedAt).toLocaleDateString(dateLocale, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-xl px-5 py-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-[var(--gentle-shadow)] animate-fade-in-up"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg text-foreground line-clamp-2">{cluster.title}</h3>
          {cluster.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{cluster.description}</p>
          )}
        </div>
        <Layers className="w-4 h-4 text-muted-foreground/40 mt-1 flex-shrink-0 ml-3" />
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span>
          {cluster.thoughtCount ?? 0} {thoughtsLabel}
        </span>
        <span>·</span>
        <span>{formatted}</span>
      </div>
    </div>
  );
}
