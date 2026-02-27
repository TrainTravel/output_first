import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Sprout, Archive, Trash2, X, Sparkles, Loader2, MessageCircle } from 'lucide-react';
import { useThoughts, Thought } from '@/hooks/useThoughts';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ThoughtContext } from '@/types/chat';

interface ThoughtGardenScreenProps {
  onBack: () => void;
  onOpenChatWithContext: (context: ThoughtContext) => void;
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

export function ThoughtGardenScreen({ onBack, onOpenChatWithContext }: ThoughtGardenScreenProps) {
  const { bilingual, t, isFr, isEs } = useLanguage();
  const { thoughts, loading, archiveThought, retagUntagged, retagAll } = useThoughts();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [retagging, setRetagging] = useState(false);

  const dateLocale = isFr ? 'fr-FR' : isEs ? 'es-ES' : 'en-US';

  const untaggedCount = useMemo(() => thoughts.filter(t => !t.aiTheme).length, [thoughts]);

  const handleChatAllThoughts = () => {
    const context: ThoughtContext = {
      mode: 'all',
      label: bilingual('Mon jardin', 'My garden', 'Mi jardín'),
      thoughts: thoughts.slice(0, 20).map(th => ({
        content: th.content,
        createdAt: th.createdAt,
        aiTheme: th.aiTheme,
      })),
    };
    onOpenChatWithContext(context);
  };

  const handleChatTheme = (group: ThemeGroup) => {
    const context: ThoughtContext = {
      mode: 'theme',
      label: group.label,
      thoughts: group.thoughts.slice(0, 20).map(th => ({
        content: th.content,
        createdAt: th.createdAt,
        aiTheme: th.aiTheme,
      })),
    };
    onOpenChatWithContext(context);
  };

  const handleRetag = async (all: boolean) => {
    setRetagging(true);
    try {
      const count = all ? await retagAll() : await retagUntagged();
      toast.success(bilingual(`${count} pensées étiquetées`, `${count} thoughts tagged`, `${count} pensamientos etiquetados`));
    } catch {
      toast.error(bilingual('Échec de l\'étiquetage', 'Tagging failed', 'Error al etiquetar'));
    }
    setRetagging(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return thoughts;
    const q = search.toLowerCase();
    return thoughts.filter(
      t => t.content.toLowerCase().includes(q) || (t.aiTheme && t.aiTheme.toLowerCase().includes(q))
    );
  }, [thoughts, search]);

  const groups = useMemo(() => groupByTheme(filtered), [filtered]);

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
          {t('Retour', 'Back', 'Volver').primary}
        </Button>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={archiveSelected}>
              <Archive className="w-4 h-4 mr-1" />
              {t('Archiver', 'Archive', 'Archivar').primary} ({selectedIds.size})
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
          {bilingual('Jardin de pensées', 'Thought Garden', 'Jardín de pensamientos')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t(
            `${thoughts.length} pensées capturées`,
            `${thoughts.length} thoughts captured`,
            `${thoughts.length} pensamientos capturados`
          ).primary}
          {groups.length > 1 && (
            <span className="ml-1">
              · {groups.length} {t('thèmes', 'themes', 'temas').primary}
            </span>
          )}
        </p>
        {!loading && thoughts.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            <Button
              variant="default"
              size="sm"
              onClick={handleChatAllThoughts}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              {bilingual('Discuter', 'Discuss', 'Discutir')}
            </Button>
            {untaggedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRetag(false)}
                disabled={retagging}
              >
                {retagging ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1.5" />
                )}
                {t(`Étiqueter ${untaggedCount} nouvelles`, `Tag ${untaggedCount} new`, `Etiquetar ${untaggedCount} nuevos`).primary}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRetag(true)}
              disabled={retagging}
            >
              {retagging ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1.5" />
              )}
              {t('Tout ré-étiqueter', 'Re-tag all', 'Re-etiquetar todo').primary}
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="max-w-lg mx-auto w-full mb-6 animate-fade-in-up">
          <Input
            placeholder={t('Rechercher…', 'Search…', 'Buscar…').primary}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground animate-gentle-pulse">
              {t('Chargement…', 'Loading…', 'Cargando…').primary}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sprout className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {search
                ? t('Aucun résultat trouvé.', 'No results found.', 'No se encontraron resultados.').primary
                : t(
                    'Votre jardin est vide. Commencez par un vide-tête !',
                    'Your garden is empty. Start with a brain dump!',
                    '¡Tu jardín está vacío. Comienza con un volcado mental!'
                  ).primary}
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
                      <span className="text-muted-foreground ml-2 text-sm font-sans font-normal">
                        ({group.thoughts.length})
                      </span>
                    </h3>
                    <button
                      onClick={() => handleChatTheme(group)}
                      className="p-1.5 rounded-full hover:bg-primary/20 text-primary transition-colors"
                      title={bilingual('Discuter ce thème', 'Discuss this theme', 'Discutir este tema')}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {group.thoughts.map(th => (
                    <ThoughtCard
                      key={th.id}
                      content={th.content}
                      date={th.createdAt}
                      selected={selectedIds.has(th.id)}
                      onToggle={() => toggleSelect(th.id)}
                      onArchive={() => archiveThought(th.id)}
                      dateLocale={dateLocale}
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
  dateLocale,
}: {
  content: string;
  date: string;
  selected: boolean;
  onToggle: () => void;
  onArchive: () => void;
  dateLocale: string;
}) {
  const formatted = new Date(date).toLocaleDateString(dateLocale, {
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
