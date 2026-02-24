import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { useClusters, Cluster, ClusterThought } from '@/hooks/useClusters';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClustersScreenProps {
  onBack: () => void;
}

export function ClustersScreen({ onBack }: ClustersScreenProps) {
  const { bilingual, isFr } = useLanguage();
  const { clusters, loading, createCluster, fetchClusterThoughts } = useClusters();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterThoughts, setClusterThoughts] = useState<ClusterThought[]>([]);
  const [loadingThoughts, setLoadingThoughts] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    await createCluster(newTitle.trim());
    setCreating(false);
    setNewTitle('');
    setShowCreate(false);
  };

  const openCluster = async (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setLoadingThoughts(true);
    const thoughts = await fetchClusterThoughts(cluster.id);
    setClusterThoughts(thoughts);
    setLoadingThoughts(false);
  };

  const backToList = () => {
    setSelectedCluster(null);
    setClusterThoughts([]);
  };

  // Detail view
  if (selectedCluster) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={backToList}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {bilingual('Retour', 'Back')}
          </Button>
        </div>

        <div className="max-w-lg mx-auto w-full">
          <h2 className="font-serif text-3xl text-foreground mb-2">{selectedCluster.title}</h2>
          {selectedCluster.description && (
            <p className="text-muted-foreground text-sm mb-6">{selectedCluster.description}</p>
          )}

          {/* Generate Proposal button */}
          <Button variant="outline" size="sm" className="mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            {bilingual('Générer une proposition', 'Generate Proposal')}
          </Button>

          {/* Linked thoughts */}
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {bilingual('Pensées liées', 'Linked Thoughts')}
            <span className="ml-2 lowercase font-normal">({clusterThoughts.length})</span>
          </h3>

          {loadingThoughts ? (
            <p className="text-muted-foreground animate-gentle-pulse py-8 text-center">
              {bilingual('Chargement…', 'Loading…')}
            </p>
          ) : clusterThoughts.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {bilingual(
                  'Aucune pensée liée pour le moment.',
                  'No linked thoughts yet.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {clusterThoughts.map(t => (
                <div
                  key={t.id}
                  className="bg-card border border-border rounded-xl px-4 py-3 animate-fade-in-up"
                >
                  <p className="text-foreground text-sm leading-relaxed">{t.content}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {new Date(t.createdAt).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {bilingual('Retour', 'Back')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowCreate(s => !s)}>
          <Plus className="w-4 h-4 mr-1" />
          {bilingual('Nouveau', 'New')}
        </Button>
      </div>

      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl text-foreground flex items-center justify-center gap-2">
          <Layers className="w-7 h-7 text-primary" />
          {bilingual('Mes Clusters', 'My Clusters')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {bilingual(
            'Regroupez vos pensées par thème.',
            'Group your thoughts by theme.'
          )}
        </p>
      </div>

      {/* Create new cluster */}
      {showCreate && (
        <div className="max-w-lg mx-auto w-full mb-6 animate-fade-in-up">
          <div className="flex gap-2">
            <Input
              placeholder={bilingual('Nom du cluster…', 'Cluster name…')}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <Button onClick={handleCreate} disabled={!newTitle.trim() || creating} size="sm">
              {creating ? '…' : bilingual('Créer', 'Create')}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground animate-gentle-pulse">
              {bilingual('Chargement…', 'Loading…')}
            </p>
          </div>
        ) : clusters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {bilingual(
                'Aucun cluster pour le moment. Créez-en un !',
                'No clusters yet. Create one!'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clusters.map(cluster => (
              <button
                key={cluster.id}
                onClick={() => openCluster(cluster)}
                className="w-full text-left bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 transition-all group animate-fade-in-up"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground font-medium">{cluster.title}</h3>
                    {cluster.description && (
                      <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">
                        {cluster.description}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {cluster.thoughtCount} {bilingual('pensées', 'thoughts')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
