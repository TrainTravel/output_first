import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Check } from 'lucide-react';
import { Cluster } from '@/hooks/useClusters';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClusterPickerProps {
  clusters: Cluster[];
  onSelect: (clusterId: string) => void;
  onCreateAndSelect?: (title: string) => void;
  trigger: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

export function ClusterPicker({ clusters, onSelect, onCreateAndSelect, trigger, align = 'end' }: ClusterPickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleSelect = (clusterId: string) => {
    onSelect(clusterId);
    setOpen(false);
  };

  const handleCreate = () => {
    const trimmed = newTitle.trim();
    if (!trimmed || !onCreateAndSelect) return;
    onCreateAndSelect(trimmed);
    setNewTitle('');
    setShowCreate(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-56 p-2" sideOffset={8}>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {clusters.length === 0 && !showCreate && (
            <p className="text-xs text-muted-foreground px-2 py-1.5">
              {t('Aucun cluster', 'No clusters').primary}
            </p>
          )}
          {clusters.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelect(c.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-accent transition-colors text-left"
            >
              <Layers className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{c.title}</span>
              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{c.thoughtCount ?? 0}</span>
            </button>
          ))}
        </div>

        {onCreateAndSelect && (
          <>
            <div className="border-t border-border my-1" />
            {showCreate ? (
              <div className="flex gap-1.5 p-1">
                <Input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder={t('Nom…', 'Name…').primary}
                  className="h-7 text-xs"
                  autoFocus
                />
                <Button size="sm" className="h-7 px-2" onClick={handleCreate} disabled={!newTitle.trim()}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Nouveau cluster', 'New cluster').primary}
              </button>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
