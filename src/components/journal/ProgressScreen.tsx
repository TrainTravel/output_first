import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { Home, Feather, Flame, Calendar as CalendarIcon, BookOpen, Sprout, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useJournalEntries, JournalEntryRow } from '@/hooks/useJournalEntries';
import { useEmotionVocab } from '@/hooks/useEmotionVocab';
import { format } from 'date-fns';
import { fr as frLocale, enUS } from 'date-fns/locale';

interface ProgressScreenProps {
  streak: number;
  totalDays: number;
  hasJournaledToday: boolean;
  onGoHome: () => void;
  onStartJournal: () => void;
  onOpenVocabulary?: () => void;
}

export function ProgressScreen({
  streak,
  totalDays,
  hasJournaledToday,
  onGoHome,
  onStartJournal,
  onOpenVocabulary,
}: ProgressScreenProps) {
  const { t, bilingual, isFr, isEs } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { entries, isLoading } = useJournalEntries();
  const { stats } = useEmotionVocab();
  const vocabPercent = stats.totalAvailable > 0 ? Math.round((stats.totalEncountered / stats.totalAvailable) * 100) : 0;

  // Dates that have entries
  const entryDates = new Set(entries.map(e => e.date));

  // Entries for the selected date
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedEntries = selectedDateStr
    ? entries.filter(e => e.date === selectedDateStr)
    : [];

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        {/* Completion Message */}
        {hasJournaledToday && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-scale-in">
              <Feather className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              {isFr ? 'Vous êtes venu(e) aujourd\'hui' : isEs ? 'Viniste hoy' : 'You showed up today'}
            </h1>
            <p className="text-muted-foreground italic">
              {isFr ? 'You showed up today' : isEs ? 'You showed up today' : 'Vous êtes venu(e) aujourd\'hui'}
            </p>
            <p className="text-muted-foreground text-sm">
              {t("C'est ce qui compte le plus.", "That's what matters most.", 'Es lo que más importa.').primary}
            </p>
          </div>
        )}

        {!hasJournaledToday && (
          <div className="text-center space-y-4">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              {isFr ? 'Vos progrès' : isEs ? 'Tu progreso' : 'Your Progress'}
            </h1>
            <p className="text-muted-foreground italic">
              {isFr ? 'Your Progress' : isEs ? 'Your Progress' : 'Vos progrès'}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl p-6 text-center shadow-gentle border border-border">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">{streak}</p>
            <p className="text-muted-foreground text-sm">{isFr ? 'jours de suite' : isEs ? 'días seguidos' : 'day streak'}</p>
            <p className="text-muted-foreground/60 text-xs">{isFr ? 'day streak' : isEs ? 'day streak' : 'jours de suite'}</p>
          </div>

          <div className="bg-card rounded-2xl p-6 text-center shadow-gentle border border-border">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">{totalDays}</p>
            <p className="text-muted-foreground text-sm">{isFr ? "jours d'écriture" : isEs ? 'días de escritura' : 'days journaled'}</p>
            <p className="text-muted-foreground/60 text-xs">{isFr ? 'days journaled' : isEs ? 'days journaled' : "jours d'écriture"}</p>
          </div>
        </div>

        {/* Emotion Vocabulary Growth */}
        {stats.totalEncountered > 0 && (
          <button
            onClick={onOpenVocabulary}
            className="w-full text-left bg-card rounded-2xl p-5 shadow-gentle border border-border space-y-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Sprout className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {isFr ? 'Vocabulaire émotionnel' : isEs ? 'Vocabulario emocional' : 'Emotion vocabulary'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isFr ? 'Your emotional vocabulary is growing' : isEs ? 'Tu vocabulario emocional crece' : 'Votre vocabulaire émotionnel grandit'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <Progress value={vocabPercent} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground font-medium">
                {stats.totalEncountered} / {stats.totalAvailable}
              </span>
            </div>
            {stats.totalUsed > 0 && (
              <p className="text-xs text-muted-foreground/70">
                {isFr 
                  ? `${stats.totalUsed} mots utilisés dans votre écriture`
                  : isEs
                    ? `${stats.totalUsed} palabras usadas en tu escritura`
                    : `${stats.totalUsed} words used in your writing`}
              </p>
            )}
          </button>
        )}

        {/* Calendar */}
        <div className="bg-card rounded-2xl p-4 shadow-gentle border border-border">
          <div className="flex items-center gap-2 mb-3 px-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {t('Journal passé', 'Past entries', 'Entradas pasadas').primary}
            </p>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={isFr ? frLocale : enUS}
            className="p-3 pointer-events-auto mx-auto"
            modifiers={{
              journaled: (date) => entryDates.has(format(date, 'yyyy-MM-dd')),
            }}
            modifiersClassNames={{
              journaled: 'bg-primary/20 text-primary font-semibold',
            }}
            disabled={(date) => date > new Date()}
          />
        </div>

        {/* Selected Entry Card */}
        {selectedDate && (
          <div className="space-y-3 animate-fade-in-up">
            {selectedEntries.length === 0 ? (
              <div className="bg-muted/50 rounded-2xl p-5 text-center border border-border">
                <p className="text-muted-foreground text-sm">
                  {t('Aucune entrée ce jour-là', 'No entry on this day', 'Sin entrada ese día').primary}
                </p>
              </div>
            ) : (
              selectedEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} isFr={isFr} />
              ))
            )}
          </div>
        )}

        {/* Affirmation */}
        <div className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10">
          <p className="text-foreground font-serif text-lg">
            {isFr ? '« Se montrer, c\'est déjà réussir. »' : isEs ? '«Aparecer ya es un logro.»' : '"Showing up counts."'}
          </p>
          <p className="text-muted-foreground text-sm italic mt-2">
            {isFr ? '"Showing up counts."' : isEs ? '"Showing up counts."' : '« Se montrer, c\'est déjà réussir. »'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!hasJournaledToday && (
            <Button variant="default" size="full" onClick={onStartJournal}>
              <Feather className="w-5 h-5 mr-2" />
              {t("Écrire aujourd'hui", 'Write today', 'Escribir hoy').primary}
            </Button>
          )}

          <Button variant="gentle" size="full" onClick={onGoHome}>
            <Home className="w-5 h-5 mr-2" />
            {t("Retour à l'accueil", 'Return home', 'Volver al inicio').primary}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EntryCard({ entry, isFr }: { entry: JournalEntryRow; isFr: boolean }) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-gentle border border-border space-y-3">
      <p className="text-foreground text-sm leading-relaxed">{entry.content}</p>
      
      {(entry.emotion || entry.emotion_fr) && (
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            {isFr ? (entry.emotion_fr || entry.emotion) : (entry.emotion || entry.emotion_fr)}
          </span>
        </div>
      )}

      {entry.gratitude && (
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-1">
            {isFr ? 'Gratitude' : 'Gratitude'}
          </p>
          <p className="text-sm text-foreground/80 italic">{entry.gratitude}</p>
        </div>
      )}
    </div>
  );
}
