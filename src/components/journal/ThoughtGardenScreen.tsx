import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Sprout, Archive, Trash2, X, Sparkles, Loader2, MessageCircle, Layers, Plus, Link2, FolderPlus, ArrowRightLeft, GripVertical } from 'lucide-react';
import { useThoughts, Thought } from '@/hooks/useThoughts';
import { useClusters, Cluster } from '@/hooks/useClusters';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ThoughtContext } from '@/types/chat';
import { ClusterPicker } from './ClusterPicker';
import { DndContext, DragOverlay, useDraggable, useDroppable, closestCenter, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';

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
  const { bilingual, t, targetLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
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
  const [activeThought, setActiveThought] = useState<Thought | null>(null);

  const dateLocale = isFr ? 'fr-FR' : isEs ? 'es-ES' : 'en-US';

  const untaggedCount = useMemo(() => thoughts.filter(t => !t.aiTheme).length, [thoughts]);

  // --- Handlers ---

  const handleChatAllThoughts = () => {
    const context: ThoughtContext = {
      mode: 'all',
      label: bilingual({ fr: 'Mon jardin', en: 'My garden', es: 'Mi jardín', ja: '私の庭', 'zh-Hans': '我的花园', 'zh-Hant': '我的花園' }),
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
      toast.success(bilingual({ fr: `${count} pensées étiquetées`, en: `${count} thoughts tagged`, es: `${count} pensamientos etiquetados`, ja: `${count}件のタグを付けました`, 'zh-Hans': `已为 ${count} 条想法打标签`, 'zh-Hant': `已為 ${count} 條想法加標籤` }));
    } catch {
      toast.error(bilingual({ fr: 'Échec de l\'étiquetage', en: 'Tagging failed', es: 'Error al etiquetar', ja: 'タグ付けに失敗しました', 'zh-Hans': '打标签失败', 'zh-Hant': '加標籤失敗' }));
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
    if (cluster) toast.success(bilingual({ fr: 'Cluster créé', en: 'Cluster created', es: 'Cluster creado', ja: 'クラスターを作成しました', 'zh-Hans': '已创建分组', 'zh-Hant': '已建立分組' }));
  };

  const handleLinkThought = async (thoughtId: string, clusterId: string) => {
    await addThoughtToCluster(clusterId, thoughtId);
    toast.success(bilingual({ fr: 'Pensée ajoutée au cluster', en: 'Thought added to cluster', es: 'Pensamiento añadido al cluster', ja: 'クラスターに思考を追加しました', 'zh-Hans': '已将想法加入分组', 'zh-Hant': '已將想法加入分組' }));
  };

  const handleCreateAndLink = async (title: string, thoughtId: string) => {
    const cluster = await createCluster(title);
    if (cluster) {
      await addThoughtToCluster(cluster.id, thoughtId);
      toast.success(bilingual({ fr: 'Cluster créé et pensée ajoutée', en: 'Cluster created & thought added', es: 'Cluster creado y pensamiento añadido', ja: 'クラスターを作成し、思考を追加しました', 'zh-Hans': '已创建分组并加入想法', 'zh-Hant': '已建立分組並加入想法' }));
    }
  };

  const handleBulkLink = async (clusterId: string) => {
    for (const id of selectedIds) {
      await addThoughtToCluster(clusterId, id);
    }
    toast.success(bilingual({ fr: `${selectedIds.size} pensées ajoutées`, en: `${selectedIds.size} thoughts added`, es: `${selectedIds.size} pensamientos añadidos`, ja: `${selectedIds.size}件の思考を追加しました`, 'zh-Hans': `已加入 ${selectedIds.size} 条想法`, 'zh-Hant': `已加入 ${selectedIds.size} 條想法` }));
    setSelectedIds(new Set());
  };

  const handleBulkCreateAndLink = async (title: string) => {
    const cluster = await createCluster(title);
    if (cluster) {
      for (const id of selectedIds) {
        await addThoughtToCluster(cluster.id, id);
      }
      toast.success(bilingual({ fr: `Cluster créé avec ${selectedIds.size} pensées`, en: `Cluster created with ${selectedIds.size} thoughts`, es: `Cluster creado con ${selectedIds.size} pensamientos`, ja: `${selectedIds.size}件の思考でクラスターを作成しました`, 'zh-Hans': `已用 ${selectedIds.size} 条想法创建分组`, 'zh-Hant': `已用 ${selectedIds.size} 條想法建立分組` }));
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
        { fr: `Cluster "${group.label}" créé avec ${group.thoughts.length} pensées`, en: `Cluster "${group.label}" created with ${group.thoughts.length} thoughts`, es: `Cluster "${group.label}" creado con ${group.thoughts.length} pensamientos`, ja: `クラスター「${group.label}」を${group.thoughts.length}件の思考で作成しました`, 'zh-Hans': `已用 ${group.thoughts.length} 条想法创建分组“${group.label}”`, 'zh-Hant': `已用 ${group.thoughts.length} 條想法建立分組「${group.label}」` }
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

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const thought = thoughts.find(t => t.id === id) || null;
    setActiveThought(thought);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveThought(null);
    const { active, over } = event;
    if (!over) return;
    const thoughtId = active.id as string;
    const targetTheme = over.id as string;
    const thought = thoughts.find(t => t.id === thoughtId);
    if (!thought) return;
    const currentTheme = thought.aiTheme || 'Uncategorized';
    if (currentTheme === targetTheme) return;
    moveThoughtToTheme(thoughtId, targetTheme === 'Uncategorized' ? '' : targetTheme);
    toast.success(bilingual({ fr: `Déplacé vers "${targetTheme}"`, en: `Moved to "${targetTheme}"`, es: `Movido a "${targetTheme}"`, ja: `「${targetTheme}」へ移動しました`, 'zh-Hans': `已移到“${targetTheme}”`, 'zh-Hant': `已移到「${targetTheme}」` }));
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t({ fr: 'Retour', en: 'Back', es: 'Volver', ja: '戻る', 'zh-Hans': '返回', 'zh-Hant': '返回' }).primary}
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
                    {t({ fr: 'Ajouter au cluster', en: 'Add to cluster', es: 'Añadir al cluster', ja: 'クラスターに追加', 'zh-Hans': '加入分组', 'zh-Hant': '加入分組' }).primary} ({selectedIds.size})
                  </Button>
                }
              />
              <Button variant="destructive" size="sm" onClick={archiveSelected}>
                <Archive className="w-4 h-4 mr-1" />
                {t({ fr: 'Archiver', en: 'Archive', es: 'Archivar', ja: 'アーカイブ', 'zh-Hans': '归档', 'zh-Hant': '封存' }).primary} ({selectedIds.size})
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
          {bilingual({ fr: 'Jardin de pensées', en: 'Thought Garden', es: 'Jardín de pensamientos', ja: '思考の庭', 'zh-Hans': '思绪花园', 'zh-Hant': '思緒花園' })}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t({ fr: `${thoughts.length} pensées capturées`, en: `${thoughts.length} thoughts captured`, es: `${thoughts.length} pensamientos capturados`, ja: `${thoughts.length}件の思考を記録`, 'zh-Hans': `已收录 ${thoughts.length} 条想法`, 'zh-Hant': `已收錄 ${thoughts.length} 條想法` }).primary}
          {groups.length > 1 && (
            <span className="ml-1">· {groups.length} {t({ fr: 'thèmes', en: 'themes', es: 'temas', ja: 'テーマ', 'zh-Hans': '个主题', 'zh-Hant': '個主題' }).primary}</span>
          )}
        </p>
        {!loading && thoughts.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            <Button variant="default" size="sm" onClick={handleChatAllThoughts}>
              <MessageCircle className="w-4 h-4 mr-1.5" />
              {bilingual({ fr: 'Discuter', en: 'Discuss', es: 'Discutir', ja: '話し合う', 'zh-Hans': '聊聊', 'zh-Hant': '聊聊' })}
            </Button>
            {untaggedCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => handleRetag(false)} disabled={retagging}>
                {retagging ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {t({ fr: `Étiqueter ${untaggedCount} nouvelles`, en: `Tag ${untaggedCount} new`, es: `Etiquetar ${untaggedCount} nuevos`, ja: `新しい${untaggedCount}件にタグを付ける`, 'zh-Hans': `为新增 ${untaggedCount} 条打标签`, 'zh-Hant': `為新增 ${untaggedCount} 條加標籤` }).primary}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleRetag(true)} disabled={retagging}>
              {retagging ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              {t({ fr: 'Tout ré-étiqueter', en: 'Re-tag all', es: 'Re-etiquetar todo', ja: 'すべて付け直す', 'zh-Hans': '全部重新打标签', 'zh-Hant': '全部重新加標籤' }).primary}
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="max-w-lg mx-auto w-full mb-6 animate-fade-in-up">
          <Input placeholder={t({ fr: 'Rechercher…', en: 'Search…', es: 'Buscar…', ja: '検索…', 'zh-Hans': '搜索…', 'zh-Hant': '搜尋…' }).primary} value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
      )}

      {/* Clusters Section */}
      <div className="max-w-lg mx-auto w-full mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            {bilingual({ fr: 'Mes Clusters', en: 'My Clusters', es: 'Mis Clusters', ja: 'マイ クラスター', 'zh-Hans': '我的分组', 'zh-Hant': '我的分組' })}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowCreateCluster(s => !s)}>
            {showCreateCluster ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 mr-1" />}
            {!showCreateCluster && t({ fr: 'Nouveau', en: 'New', es: 'Nuevo', ja: '新規', 'zh-Hans': '新建', 'zh-Hant': '新增' }).primary}
          </Button>
        </div>

        {showCreateCluster && (
          <div className="flex gap-2 mb-3 animate-fade-in-up">
            <Input
              placeholder={t({ fr: 'Nom du cluster…', en: 'Cluster name…', es: 'Nombre del cluster…', ja: 'クラスター名…', 'zh-Hans': '分组名称…', 'zh-Hant': '分組名稱…' }).primary}
              value={newClusterTitle}
              onChange={e => setNewClusterTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateCluster()}
              autoFocus
            />
            <Button onClick={handleCreateCluster} disabled={!newClusterTitle.trim() || creatingCluster} size="sm">
              {creatingCluster ? '…' : t({ fr: 'Créer', en: 'Create', es: 'Crear', ja: '作成', 'zh-Hans': '创建', 'zh-Hant': '建立' }).primary}
            </Button>
          </div>
        )}

        {clustersLoading ? (
          <p className="text-muted-foreground text-sm animate-gentle-pulse">{t({ fr: 'Chargement…', en: 'Loading…', es: 'Cargando…', ja: '読み込み中…', 'zh-Hans': '加载中…', 'zh-Hant': '載入中…' }).primary}</p>
        ) : clusters.length === 0 ? (
          <div className="bg-muted/50 rounded-xl p-4 text-center border border-border">
            <p className="text-muted-foreground text-sm">
              {t({ fr: 'Pas encore de clusters. Créez-en un pour regrouper vos pensées.', en: 'No clusters yet. Create one to group your thoughts.', es: 'Aún no hay clusters. Crea uno para agrupar tus pensamientos.', ja: 'まだクラスターがありません。作成して思考をまとめましょう。', 'zh-Hans': '还没有分组。新建一个，把想法收拢起来。', 'zh-Hant': '還沒有分組。新增一個，把想法收攏起來。' }).primary}
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
            <p className="text-muted-foreground animate-gentle-pulse">{t({ fr: 'Chargement…', en: 'Loading…', es: 'Cargando…', ja: '読み込み中…', 'zh-Hans': '加载中…', 'zh-Hant': '載入中…' }).primary}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sprout className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search
                ? t({ fr: 'Aucun résultat trouvé.', en: 'No results found.', es: 'No se encontraron resultados.', ja: '結果が見つかりませんでした。', 'zh-Hans': '没有找到结果。', 'zh-Hant': '沒有找到結果。' }).primary
                : t({ fr: 'Votre jardin est vide. Commencez par un vide-tête !', en: 'Your garden is empty. Start with a brain dump!', es: '¡Tu jardín está vacío. Comienza con un volcado mental!', ja: '庭はまだ空っぽです。脳のメモから始めましょう！', 'zh-Hans': '花园还是空的，先来一次想法清空吧！', 'zh-Hant': '花園還是空的，先來一次想法清空吧！' }).primary}
            </p>
          </div>
        ) : (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="space-y-6">
              {groups.map((group) => {
                // When there are multiple themes, each group sits in its own soft
                // "planter" — a sage-tinted container that visually holds its cards
                // together. With a single theme there's nothing to separate from,
                // so we skip the wrapper to avoid an empty-looking frame.
                const isMulti = groups.length > 1;
                return (
                  <ThemeDropZone key={group.label} themeLabel={group.label} isOver={false}>
                    <div
                      className={
                        isMulti
                          ? 'rounded-3xl bg-primary/[0.04] border border-primary/10 p-5 animate-fade-in-up'
                          : 'animate-fade-in-up'
                      }
                    >
                      {isMulti && (
                        <div className="flex items-center justify-between mb-4 px-1">
                          <h3 className="font-serif text-lg text-foreground flex items-center gap-2 tracking-tight">
                            <Sprout className="w-4 h-4 text-primary/70" />
                            {group.label}
                            <span className="text-muted-foreground ml-1 text-sm font-sans font-normal">
                              ({group.thoughts.length})
                            </span>
                          </h3>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleConvertTheme(group)}
                              disabled={convertingTheme === group.label}
                              className="p-1.5 rounded-full hover:bg-primary/15 text-primary/80 hover:text-primary transition-colors disabled:opacity-50"
                              title={bilingual({ fr: 'Convertir en cluster', en: 'Convert to cluster', es: 'Convertir a cluster', ja: 'クラスターに変換', 'zh-Hans': '转为分组', 'zh-Hant': '轉為分組' })}
                            >
                              {convertingTheme === group.label ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FolderPlus className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleChatTheme(group)}
                              className="p-1.5 rounded-full hover:bg-primary/15 text-primary/80 hover:text-primary transition-colors"
                              title={bilingual({ fr: 'Discuter ce thème', en: 'Discuss this theme', es: 'Discutir este tema', ja: 'このテーマを話し合う', 'zh-Hans': '聊聊这个主题', 'zh-Hant': '聊聊這個主題' })}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        {group.thoughts.map((thought, cardIdx) => (
                          <div
                            key={thought.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${cardIdx * 60}ms`, animationFillMode: 'backwards' }}
                          >
                            <DraggableThoughtCard
                              thought={thought}
                              currentTheme={thought.aiTheme}
                              themeLabels={themeLabels}
                              selected={selectedIds.has(thought.id)}
                              onToggle={() => toggleSelect(thought.id)}
                              onArchive={() => archiveThought(thought.id)}
                              onMoveToTheme={(theme) => {
                                moveThoughtToTheme(thought.id, theme);
                                toast.success(bilingual({ fr: `Déplacé vers "${theme}"`, en: `Moved to "${theme}"`, es: `Movido a "${theme}"`, ja: `「${theme}」へ移動しました`, 'zh-Hans': `已移到“${theme}”`, 'zh-Hant': `已移到「${theme}」` }));
                              }}
                              onLinkToCluster={(clusterId) => handleLinkThought(thought.id, clusterId)}
                              onCreateAndLink={(title) => handleCreateAndLink(title, thought.id)}
                              clusters={clusters}
                              isFr={isFr}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </ThemeDropZone>
                );
              })}
            </div>
            <DragOverlay>
              {activeThought && (
                <div className="bg-card border border-primary rounded-xl px-4 py-3 shadow-lg opacity-90 max-w-lg">
                  <p className="text-foreground text-sm leading-relaxed">{activeThought.content}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
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

function ThemeDropZone({ themeLabel, children }: { themeLabel: string; isOver?: boolean; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: themeLabel });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-all duration-200 ${isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}
    >
      {children}
    </div>
  );
}

interface DraggableThoughtCardProps {
  thought: Thought;
  currentTheme: string | null;
  themeLabels: string[];
  selected: boolean;
  onToggle: () => void;
  onArchive: () => void;
  onMoveToTheme: (theme: string) => void;
  onLinkToCluster: (clusterId: string) => void;
  onCreateAndLink: (title: string) => void;
  clusters: Cluster[];
  isFr: boolean;
}

function DraggableThoughtCard(props: DraggableThoughtCardProps) {
  const { thought, currentTheme, themeLabels, selected, onToggle, onArchive, onMoveToTheme, onLinkToCluster, onCreateAndLink, clusters, isFr } = props;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: thought.id });
  const formatted = new Date(thought.createdAt).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' });
  const [showThemePicker, setShowThemePicker] = useState(false);
  const otherThemes = themeLabels.filter(l => l !== currentTheme);

  return (
    <div
      ref={setNodeRef}
      onClick={onToggle}
      className={`group relative bg-card border rounded-xl px-4 py-3 cursor-pointer transition-all ${isDragging ? 'opacity-30' : ''} ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          aria-label="Drag to move"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm leading-relaxed pr-12">{thought.content}</p>
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
      </div>
    </div>
  );
}
