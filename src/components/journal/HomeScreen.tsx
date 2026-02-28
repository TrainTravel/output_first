import { Button } from '@/components/ui/button';
import { Feather, CheckCircle2, MessageCircle, Zap, Sprout, Layers, LogOut, Flame, CalendarDays, Mountain } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GardenThemeSelector } from './GardenThemeSelector';

interface HomeScreenProps {
  hasJournaledToday: boolean;
  streak: number;
  totalDays: number;
  onStartJournal: () => void;
  onViewProgress: () => void;
  onOpenChat: () => void;
  onOpenBrainDump: () => void;
  onOpenThoughtGarden: () => void;
  onOpenClusters: () => void;
  onOpenZenGarden: () => void;
}

export function HomeScreen({ hasJournaledToday, streak, totalDays, onStartJournal, onViewProgress, onOpenChat, onOpenBrainDump, onOpenThoughtGarden, onOpenClusters, onOpenZenGarden }: HomeScreenProps) {
  const { bilingual, t, isFr } = useLanguage();
  const { signOut, user } = useAuth();
  const today = new Date();
  const formattedDatePrimary = today.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    ...(isFr ? { day: 'numeric', month: 'long' } : { month: 'long', day: 'numeric' }),
  });
  const formattedDateSecondary = today.toLocaleDateString(isFr ? 'en-US' : 'fr-FR', {
    weekday: 'long',
    ...(isFr ? { month: 'long', day: 'numeric' } : { day: 'numeric', month: 'long' }),
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">
        {/* Language Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            {user && (
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
                <LogOut className="w-4 h-4 mr-1" />
                {t('Déconnexion', 'Sign out').primary}
              </Button>
            )}
            <GardenThemeSelector />
          </div>
          <LanguageToggle />
        </div>

        {/* Date */}
        <div className="text-center space-y-2">
          <p className="text-foreground/80 text-sm tracking-wide capitalize">
            {formattedDatePrimary}
          </p>
          <p className="text-muted-foreground text-xs tracking-wide">
            {formattedDateSecondary}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mt-4">
            OutputFirst
          </h1>
          <p className="text-muted-foreground text-sm italic">
            {t('Journaling en français', 'French journaling practice').primary}
          </p>
        </div>

        {/* Status + Progress */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full
              ${hasJournaledToday 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {hasJournaledToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('Terminé', 'Completed').primary}</span>
                </>
              ) : (
                <>
                  <Feather className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('Pas encore', 'Not started').primary}</span>
                </>
              )}
            </div>
          </div>

          {/* Inline Progress Card */}
          <button
            onClick={onViewProgress}
            className="w-full rounded-xl border-2 border-primary/20 bg-primary/5 text-card-foreground shadow-sm p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer text-left"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-serif font-semibold text-foreground">{streak}</p>
                  <p className="text-xs text-muted-foreground">{t('Série', 'Streak').primary}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent/30 p-2">
                  <CalendarDays className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-serif font-semibold text-foreground">{totalDays}</p>
                  <p className="text-xs text-muted-foreground">{t('Jours au total', 'Total days').primary}</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Main Actions */}
        <div className="space-y-3">
          <Button
            variant="default"
            size="full"
            onClick={onStartJournal}
            className="animate-breathe"
          >
            <Feather className="w-5 h-5 mr-2" />
            {hasJournaledToday
              ? t('Écrire encore', 'Write another').primary
              : t("Écrire aujourd'hui", 'Write today').primary
            }
          </Button>

          <Button variant="outline" size="full" onClick={onOpenChat}>
            <MessageCircle className="w-5 h-5 mr-2" />
            {bilingual('Conversation', 'Conversation')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenBrainDump}>
            <Zap className="w-5 h-5 mr-2" />
            {bilingual('Vide-tête', 'Brain Dump')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenThoughtGarden}>
            <Sprout className="w-5 h-5 mr-2" />
            {bilingual('Jardin de pensées', 'Thought Garden')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenClusters}>
            <Layers className="w-5 h-5 mr-2" />
            {bilingual('Mes Clusters', 'My Clusters')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenZenGarden}>
            <Mountain className="w-5 h-5 mr-2" />
            {bilingual('Jardin Zen', 'Zen Garden')}
          </Button>

          <p className="text-center text-muted-foreground text-sm pt-2">
            {t('Une ou deux phrases suffisent.', 'One or two sentences is enough.').primary}
          </p>
        </div>

      </div>
    </div>
  );
}
