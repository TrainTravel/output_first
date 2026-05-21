import { useState, useMemo } from 'react';
import { ArrowLeft, Sprout, Check, Eye, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEmotionVocab } from '@/hooks/useEmotionVocab';
import { EMOTION_SUGGESTIONS, EmotionWord } from '@/types/journal';
import { Progress } from '@/components/ui/progress';
import { EmotionDetailDrawer } from './EmotionDetailDrawer';

type FilterMode = 'all' | 'encountered' | 'used' | 'new';

interface VocabularyScreenProps {
  onBack: () => void;
}

export function VocabularyScreen({ onBack }: VocabularyScreenProps) {
  const { t, targetLang } = useLanguage();
  const isFr = targetLang === 'fr';
  const isEs = targetLang === 'es';
  const { stats, isFirstEncounter } = useEmotionVocab();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [drawerWord, setDrawerWord] = useState<EmotionWord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load raw state for detailed checks
  const rawState = useMemo(() => {
    try {
      const raw = localStorage.getItem('outputfirst_emotion_vocab');
      return raw ? JSON.parse(raw) as { encountered: string[]; used: Record<string, number>; lastSeen: Record<string, string> } : { encountered: [], used: {}, lastSeen: {} };
    } catch { return { encountered: [] as string[], used: {} as Record<string, number>, lastSeen: {} as Record<string, string> }; }
  }, []);

  const isEncountered = (word: EmotionWord) => rawState.encountered.includes(word.en);
  const isUsed = (word: EmotionWord) => (rawState.used[word.en] || 0) > 0;
  const useCount = (word: EmotionWord) => rawState.used[word.en] || 0;

  const filteredCategories = useMemo(() => {
    return EMOTION_SUGGESTIONS.map(group => {
      const filtered = group.emotions.filter(w => {
        if (filter === 'all') return true;
        if (filter === 'encountered') return isEncountered(w);
        if (filter === 'used') return isUsed(w);
        if (filter === 'new') return !isEncountered(w);
        return true;
      });
      return { ...group, emotions: filtered };
    }).filter(g => g.emotions.length > 0);
  }, [filter, rawState]);

  const vocabPercent = stats.totalAvailable > 0
    ? Math.round((stats.totalEncountered / stats.totalAvailable) * 100) : 0;

  const filters: { key: FilterMode; label: string; count: number }[] = [
    { key: 'all', label: t('Tous', 'All', 'Todos').primary, count: stats.totalAvailable },
    { key: 'encountered', label: t('Vus', 'Seen', 'Vistos').primary, count: stats.totalEncountered },
    { key: 'used', label: t('Utilisés', 'Used', 'Usados').primary, count: stats.totalUsed },
    { key: 'new', label: t('Nouveaux', 'New', 'Nuevos').primary, count: stats.totalAvailable - stats.totalEncountered },
  ];

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col animate-fade-in-up">
        {/* Back */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">{t('Retour', 'Back', 'Volver').primary}</span>
        </button>

        {/* Header */}
        <div className="mb-6 space-y-2">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground">
            {t('Votre vocabulaire émotionnel', 'Your emotion vocabulary', 'Tu vocabulario emocional').primary}
          </h2>
          <p className="text-muted-foreground italic text-sm">
            {t('Your emotion vocabulary', 'Votre vocabulaire émotionnel', 'Your emotion vocabulary').primary}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Sprout className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t('Vocabulaire exploré', 'Words explored', 'Vocabulario explorado').primary}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={vocabPercent} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground font-medium">
                  {stats.totalEncountered} / {stats.totalAvailable}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {stats.totalEncountered} {t('vus', 'seen', 'vistos').primary}
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" /> {stats.totalUsed} {t('utilisés', 'used', 'usados').primary}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {stats.totalAvailable - stats.totalEncountered} {t('à découvrir', 'to discover', 'por descubrir').primary}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                ${filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Word Grid */}
        <div className="flex-1 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                {filter === 'used'
                  ? t("Vous n'avez pas encore utilisé de mots.", "You haven't used any words yet.", "Aún no has usado ninguna palabra.").primary
                  : filter === 'new'
                    ? t('Tous les mots ont été découverts !', 'All words have been discovered!', '¡Todas las palabras han sido descubiertas!').primary
                    : t('Aucun mot à afficher.', 'No words to show.', 'No hay palabras para mostrar.').primary}
              </p>
            </div>
          ) : (
            filteredCategories.map(group => (
              <div key={group.category} className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  {isFr ? (
                    <>{group.categoryFr} <span className="text-muted-foreground/60">/ {group.category}</span></>
                  ) : isEs ? (
                    <>{group.categoryEs} <span className="text-muted-foreground/60">/ {group.category}</span></>
                  ) : (
                    <>{group.category} <span className="text-muted-foreground/60">/ {group.categoryFr}</span></>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.emotions.map(emotion => {
                    const encountered = isEncountered(emotion);
                    const used = isUsed(emotion);
                    const count = useCount(emotion);

                    return (
                      <button
                        key={emotion.en}
                        onClick={() => { setDrawerWord(emotion); setDrawerOpen(true); }}
                        className={`
                          px-3 py-2 rounded-full text-sm transition-all duration-200 relative
                          ${used
                            ? 'bg-primary/15 border border-primary/30 text-foreground'
                            : encountered
                              ? 'bg-card border border-border text-foreground'
                              : 'bg-muted/50 border border-border/50 text-muted-foreground'
                          }
                          hover:shadow-gentle cursor-pointer
                        `}
                      >
                        {isFr ? (
                          <>
                            <span className={used ? 'font-medium' : ''}>{emotion.fr}</span>
                            <span className="text-xs opacity-60 ml-1">({emotion.en})</span>
                          </>
                        ) : isEs ? (
                          <>
                            <span className={used ? 'font-medium' : ''}>{emotion.es}</span>
                            <span className="text-xs opacity-60 ml-1">({emotion.en})</span>
                          </>
                        ) : (
                          <>
                            <span className={used ? 'font-medium' : ''}>{emotion.en}</span>
                            <span className="text-xs opacity-60 ml-1">({emotion.fr})</span>
                          </>
                        )}
                        {used && count > 0 && (
                          <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                            {count}
                          </span>
                        )}
                        {!encountered && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <EmotionDetailDrawer
        word={drawerWord}
        isOpen={drawerOpen}
        isSelected={false}
        atMax={true}
        onClose={() => setDrawerOpen(false)}
        onToggleSelect={() => {}}
        language={targetLang}
      />
    </div>
  );
}
