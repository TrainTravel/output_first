import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Sprout, Archive, Trash2, X, Sparkles, Loader2, MessageCircle, Layers, Plus, Link2, FolderPlus, ArrowRightLeft } from 'lucide-react';
import { useThoughts, Thought } from '@/hooks/useThoughts';
import { useClusters, Cluster } from '@/hooks/useClusters';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ThoughtContext } from '@/types/chat';
import { ClusterPicker } from './ClusterPicker';

interface ThoughtGardenScreenProps {
  onBack: () => void;
  onOpenChatWithContext: (context: ThoughtContext) => void;
  onOpenCluster: (clusterId: string) => void;
}

interface ThemeGroup {
  label: string;
  thoughts: Thought[];
}

function groupByTheme(thoughts: Thought[]): ThemeGroup[] {
  const map = new Map<string, Thought[]>();
  for (const t of thoughts) {
    const key = t.aiTheme || 'Uncategorized';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return [...map.entries()]
    .sort(([a, aList], [b, bList]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return bList.length - aList.length;
    })
    .map(([label, thoughts]) => ({ label, thoughts }));
}

export function ThoughtGardenScreen({ onBack, onOpenChatWithContext, onOpenCluster }: ThoughtGardenScreenProps) {
  const { bilingual, t, isFr } = useLanguage();
  const { thoughts, loading, archiveThought, moveThoughtToTheme, retagUntagged, retagAll } = useThoughts();
  const { clusters, loading: clustersLoading, createCluster, addThoughtToCluster, fetchClusters } = useClusters();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [retagging, setRetagging] = useState(false);
  const [showCreateCluster, setShowCreateCluster] = useState(false);
  const [newClusterTitle, setNewClusterTitle] = useState('');
  const [creatingCluster, setCreatingCluster] = useState(false);
  const [convertingTheme, setConvertingTheme] = useState<string | null>(null);

  const untaggedCount = useMemo(() => thoughts.filter(t => !t.aiTheme).length, [thoughts]);

  // --- Handlers ---

  const handleChatAllThoughts = () => {
    const context: ThoughtContext = {
      mode: 'all',
      label: bilingual('Mon jardin', 'My garden'),
      thoughts: thoughts.slice(0, 20).map(th => ({ content: th.content, createdAt: th.createdAt, aiTheme: th.aiTheme })),
    };
    onOpenChatWithContext(context);
  };

  const handleChatTheme = (group: ThemeGroup) => {
    const context: ThoughtContext = {
      mode: 'theme',
      label: group.label,
      thoughts: group.thoughts.slice(0, 20).map(th => ({ content: th.content, createdAt: th.createdAt, aiTheme: th.aiTheme })),
    };
    onOpenChatWithContext(context);
  };

  const handleRetag = async (all: boolean) => {
    setRetagging(true);
    try {
      const count = all ? await retagAll() : await retagUntagged();
      toast.success(bilingual(`${count} pensées étiquetées`, `${count} thoughts tagged`));
    } catch {
      toast.error(bilingual('Échec de l\'étiquetage', 'Tagging failed'));
    }
    setRetagging(false);
  };

  const handleCreateCluster = async () => {
    const trimmed = newClusterTitle.trim();
    if (!trimmed || creatingCluster) return;
    setCreatingCluster(true);
    const cluster = await createCluster(trimmed);
    setCreatingCluster(false);
    setNewClusterTitle('');
    setShowCreateCluster(false);
    if (cluster) toast.success(bilingual('Cluster créé', 'Cluster created'));
  };

  const handleLinkThought = async (thoughtId: string, clusterId: string) => {
    await addThoughtToCluster(clusterId, thoughtId);
    toast.success(bilingual('Pensée ajoutée au cluster', 'Thought added to cluster'));
  };

  const handleCreateAndLink = async (title: string, thoughtId: string) => {
    const cluster = await createCluster(title);
    if (cluster) {
      await addThoughtToCluster(cluster.id, thoughtId);
      toast.success(bilingual('Cluster créé et pensée ajoutée', 'Cluster created & thought added'));
    }
  };

  const handleBulkLink = async (clusterId: string) => {
    for (const id of selectedIds) {
      await addThoughtToCluster(clusterId, id);
    }
    toast.success(bilingual(`${selectedIds.size} pensées ajoutées`, `${selectedIds.size} thoughts added`));
    setSelectedIds(new Set());
  };

  const handleBulkCreateAndLink = async (title: string) => {
    const cluster = await createCluster(title);
    if (cluster) {
      for (const id of selectedIds) {
        await addThoughtToCluster(cluster.id, id);
      }
      toast.success(bilingual(`Cluster créé avec ${selectedIds.size} pensées`, `Cluster created with ${selectedIds.size} thoughts`));
      setSelectedIds(new Set());
    }
  };

  const handleConvertTheme = async (group: ThemeGroup) => {
    setConvertingTheme(group.label);
    const cluster = await createCluster(group.label);
    if (cluster) {
      for (const th of group.thoughts) {
        await addThoughtToCluster(cluster.id, th.id);
      }
      toast.success(bilingual(
        `Cluster "${group.label}" créé avec ${group.thoughts.length} pensées`,
        `Cluster "${group.label}" created with ${group.thoughts.length} thoughts`
      ));
    }
    setConvertingTheme(null);
  };

  // --- Filtering ---

  const filtered = useMemo(() => {
    if (!search.trim()) return thoughts;
    const q = search.toLowerCase();
    return thoughts.filter(
      t => t.content.toLowerCase().includes(q) || (t.aiTheme && t.aiTheme.toLowerCase().includes(q))
    );
  }, [thoughts, search]);

  const groups = useMemo(() => groupByTheme(filtered), [filtered]);
  const themeLabels = useMemo(() => groups.map(g => g.label).filter(l => l !== 'Uncategorized'), [groups]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const archiveSelected = async () => {
    for (const id of selectedIds) await archiveThought(id);
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('Retour', 'Back').primary}
        </Button>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <ClusterPicker
                clusters={clusters}
                onSelect={handleBulkLink}
                onCreateAndSelect={handleBulkCreateAndLink}
                trigger={
                  <Button variant="outline" size="sm">
                    <Layers className="w-4 h-4 mr-1" />
                    {t('Ajouter au cluster', 'Add to cluster').primary} ({selectedIds.size})
                  </Button>
                }
              />
              <Button variant="destructive" size="sm" onClick={archiveSelected}>
                <Archive className="w-4 h-4 mr-1" />
                {t('Archiver', 'Archive').primary} ({selectedIds.size})
              </Button>
            </>
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
          {t(`${thoughts.length} pensées capturées`, `${thoughts.length} thoughts captured`).primary}
          {groups.length > 1 && (
            <span className="ml-1">· {groups.length} {t('thèmes', 'themes').primary}</span>
          )}
        </p>
        {!loading && thoughts.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            <Button variant="default" size="sm" onClick={handleChatAllThoughts}>
              <MessageCircle className="w-4 h-4 mr-1.5" />
              {bilingual('Discuter', 'Discuss')}
            </Button>
            {untaggedCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => handleRetag(false)} disabled={retagging}>
                {retagging ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {t(`Étiqueter ${untaggedCount} nouvelles`, `Tag ${untaggedCount} new`).primary}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleRetag(true)} disabled={retagging}>
              {retagging ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              {t('Tout ré-étiqueter', 'Re-tag all').primary}
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="max-w-lg mx-auto w-full mb-6 animate-fade-in-up">
          <Input placeholder={t('Rechercher…', 'Search…').primary} value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
      )}

      {/* Clusters Section */}
      <div className="max-w-lg mx-auto w-full mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            {bilingual('Mes Clusters', 'My Clusters')}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowCreateCluster(s => !s)}>
            {showCreateCluster ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-1" />}
            {!showCreateCluster && t('Nouveau', 'New').primary}
          </Button>
        </div>

        {showCreateCluster && (
          <div className="flex gap-2 mb-3 animate-fade-in-up">
            <Input
              placeholder={t('Nom du cluster…', 'Cluster name…').primary}
              value={newClusterTitle}
              onChange={e => setNewClusterTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateCluster()}
              autoFocus
            />
            <Button onClick={handleCreateCluster} disabled={!newClusterTitle.trim() || creatingCluster} size="sm">
              {creatingCluster ? '…' : t('Créer', 'Create').primary}
            </Button>
          </div>
        )}

        {clustersLoading ? (
          <p className="text-muted-foreground text-sm animate-gentle-pulse">{t('Chargement…', 'Loading…').primary}</p>
        ) : clusters.length === 0 ? (
          <div className="bg-muted/50 rounded-xl p-4 text-center border border-border">
            <p className="text-muted-foreground text-sm">
              {t('Pas encore de clusters. Créez-en un pour regrouper vos pensées.', 'No clusters yet. Create one to group your thoughts.').primary}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {clusters.map(cluster => (
              <ClusterCard key={cluster.id} cluster={cluster} onClick={() => onOpenCluster(cluster.id)} isFr={isFr} />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      {thoughts.length > 0 && clusters.length > 0 && (
        <div className="max-w-lg mx-auto w-full mb-6"><div className="border-t border-border" /></div>
      )}

      {/* Thoughts grouped by theme */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground animate-gentle-pulse">{t('Chargement…', 'Loading…').primary}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sprout className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search
                ? t('Aucun résultat trouvé.', 'No results found.').primary
                : t('Votre jardin est vide. Commencez par un vide-tête !', 'Your garden is empty. Start with a brain dump!').primary}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group, idx) => (
              <div key={idx} className="animate-fade-in-up">
                {groups.length > 1 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
                    <h3 className="font-serif text-lg font-semibold text-foreground tracking-tight">
                      {group.label}
                      <span className="text-muted-foreground ml-2 text-sm font-sans font-normal">({group.thoughts.length})</span>
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleConvertTheme(group)}
                        disabled={convertingTheme === group.label}
                        className="p-1.5 rounded-full hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
                        title={bilingual('Convertir en cluster', 'Convert to cluster')}
                      >
                        {convertingTheme === group.label ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FolderPlus className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleChatTheme(group)}
                        className="p-1.5 rounded-full hover:bg-primary/20 text-primary transition-colors"
                        title={bilingual('Discuter ce thème', 'Discuss this theme')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {group.thoughts.map(thought => (
                    <ThoughtCard
                      key={thought.id}
                      content={thought.content}
                      date={thought.createdAt}
                      currentTheme={thought.aiTheme}
                      themeLabels={themeLabels}
                      selected={selectedIds.has(thought.id)}
                      onToggle={() => toggleSelect(thought.id)}
                      onArchive={() => archiveThought(thought.id)}
                      onMoveToTheme={(theme) => {
                        moveThoughtToTheme(thought.id, theme);
                        toast.success(bilingual(`Déplacé vers "${theme}"`, `Moved to "${theme}"`));
                      }}
                      onLinkToCluster={(clusterId) => handleLinkThought(thought.id, clusterId)}
                      onCreateAndLink={(title) => handleCreateAndLink(title, thought.id)}
                      clusters={clusters}
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

function ClusterCard({ cluster, onClick, isFr }: { cluster: Cluster; onClick: () => void; isFr: boolean }) {
  const formatted = new Date(cluster.updatedAt).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' });
  return (
    <div onClick={onClick} className="group bg-card border border-border rounded-xl px-4 py-3 cursor-pointer transition-all hover:border-primary/30 hover:shadow-[var(--gentle-shadow)]">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-base text-foreground truncate">{cluster.title}</h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0 ml-3">
          <span>{cluster.thoughtCount ?? 0} {isFr ? 'pensées' : 'thoughts'}</span>
          <span>·</span>
          <span>{formatted}</span>
        </div>
      </div>
    </div>
  );
}

function ThoughtCard({
  content, date, currentTheme, themeLabels, selected, onToggle, onArchive, onMoveToTheme, onLinkToCluster, onCreateAndLink, clusters, isFr,
}: {
  content: string; date: string; currentTheme: string | null; themeLabels: string[];
  selected: boolean; onToggle: () => void; onArchive: () => void;
  onMoveToTheme: (theme: string) => void;
  onLinkToCluster: (clusterId: string) => void; onCreateAndLink: (title: string) => void;
  clusters: Cluster[]; isFr: boolean;
}) {
  const formatted = new Date(date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' });
  const [showThemePicker, setShowThemePicker] = useState(false);
  const otherThemes = themeLabels.filter(l => l !== currentTheme);

  return (
    <div
      onClick={onToggle}
      className={`group relative bg-card border rounded-xl px-4 py-3 cursor-pointer transition-all ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}
    >
      <p className="text-foreground text-sm leading-relaxed pr-16">{content}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{formatted}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Move to theme */}
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowThemePicker(p => !p); }}
              className="text-muted-foreground hover:text-primary transition-colors p-0.5"
              aria-label={isFr ? 'Déplacer vers un thème' : 'Move to theme'}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            {showThemePicker && otherThemes.length > 0 && (
              <div
                className="absolute right-0 bottom-7 z-50 bg-popover border border-border rounded-lg shadow-md py-1 min-w-[160px] animate-fade-in-up"
                onClick={e => e.stopPropagation()}
              >
                {otherThemes.map(theme => (
                  <button
                    key={theme}
                    onClick={() => { onMoveToTheme(theme); setShowThemePicker(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-accent/50 transition-colors truncate"
                  >
                    {theme}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ClusterPicker
            clusters={clusters}
            onSelect={onLinkToCluster}
            onCreateAndSelect={onCreateAndLink}
            align="end"
            trigger={
              <button
                onClick={e => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                aria-label="Link to cluster"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
            }
          />
          <button
            onClick={e => { e.stopPropagation(); onArchive(); }}
            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
            aria-label="Archive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
