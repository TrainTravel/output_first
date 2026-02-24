import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Sprout, Archive, Trash2, X } from 'lucide-react';
import { useThoughts } from '@/hooks/useThoughts';
import { useLanguage } from '@/contexts/LanguageContext';

interface ThoughtGardenScreenProps {
  onBack: () => void;
}

export function ThoughtGardenScreen({ onBack }: ThoughtGardenScreenProps) {
  const { bilingual, isFr } = useLanguage();
  const { thoughts, loading, archiveThought } = useThoughts();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return thoughts;
    const q = search.toLowerCase();
    return thoughts.filter(
      t => t.content.toLowerCase().includes(q) || (t.aiTheme && t.aiTheme.toLowerCase().includes(q))
    );
  }, [thoughts, search]);

  // Group by AI theme
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    const ungrouped: typeof filtered = [];

    for (const t of filtered) {
      if (t.aiTheme) {
        if (!groups[t.aiTheme]) groups[t.aiTheme] = [];
        groups[t.aiTheme].push(t);
      } else {
        ungrouped.push(t);
      }
    }

    return { themed: groups, ungrouped };
  }, [filtered]);

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

  const allThemeKeys = Object.keys(grouped.themed).sort();

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(s => !s)}
          >
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground animate-gentle-pulse">
              {bilingual('Chargement…', 'Loading…')}
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
            {/* Themed groups */}
            {allThemeKeys.map(theme => (
              <div key={theme} className="animate-fade-in-up">
                <h3 className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
                  {theme}
                </h3>
                <div className="space-y-2">
                  {grouped.themed[theme].map(t => (
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

            {/* Ungrouped */}
            {grouped.ungrouped.length > 0 && (
              <div className="animate-fade-in-up">
                {allThemeKeys.length > 0 && (
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {bilingual('Non classées', 'Uncategorized')}
                  </h3>
                )}
                <div className="space-y-2">
                  {grouped.ungrouped.map(t => (
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
            )}
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
