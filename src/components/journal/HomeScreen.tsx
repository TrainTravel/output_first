import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Feather, CheckCircle2, Zap, Sprout, LogOut, Flame, CalendarDays, Mountain, PenLine, Trophy, Hourglass, Target } from 'lucide-react';
import { BADGES } from '@/types/journal';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GardenThemeSelector } from './GardenThemeSelector';
import { Badge } from '@/types/journal';

interface HomeScreenProps {
  hasJournaledToday: boolean;
  streak: number;
  totalDays: number;
  totalWords: number;
  earnedBadges: Badge[];
  onStartJournal: () => void;
  onStartFreeWrite: () => void;
  onViewProgress: () => void;
  onOpenChat: () => void;
  onOpenBrainDump: () => void;
  onOpenSmallWins: () => void;
  onOpenThoughtGarden: () => void;
  onOpenZenGarden: () => void;
  onOpenSandTimer: () => void;
  onOpenFocusPlan: () => void;
  onOpenVocabulary: () => void;
}

export function HomeScreen({ hasJournaledToday, streak, totalDays, totalWords, earnedBadges, onStartJournal, onStartFreeWrite, onViewProgress, onOpenChat, onOpenBrainDump, onOpenSmallWins, onOpenThoughtGarden, onOpenZenGarden, onOpenSandTimer, onOpenFocusPlan, onOpenVocabulary }: HomeScreenProps) {
  const { bilingual, t, isFr, isEs, lang } = useLanguage();
  const { signOut, user } = useAuth();
  const today = new Date();
  const primaryLocale = isFr ? 'fr-FR' : isEs ? 'es-ES' : 'en-US';
  const secondaryLocale = isFr ? 'en-US' : isEs ? 'en-US' : 'fr-FR';
  const frStyle = { day: 'numeric' as const, month: 'long' as const };
  const enStyle = { month: 'long' as const, day: 'numeric' as const };
  const formattedDatePrimary = today.toLocaleDateString(primaryLocale, {
    weekday: 'long',
    ...(isFr || isEs ? frStyle : enStyle),
  });
  const formattedDateSecondary = today.toLocaleDateString(secondaryLocale, {
    weekday: 'long',
    ...(!isFr && !isEs ? frStyle : enStyle),
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
                {t('Déconnexion', 'Sign out', 'Cerrar sesión').primary}
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
            {t('Journaling en français', 'French journaling practice', 'Práctica de journaling en francés').primary}
          </p>
        </div>

        {/* Status Badge Only */}
        {hasJournaledToday && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">{t('Terminé', 'Completed', 'Completado').primary}</span>
            </div>
          </div>
        )}

        {/* Compact Progress Card */}
        <button
          onClick={onViewProgress}
          className="w-full rounded-xl border-2 border-primary/20 bg-primary/5 text-card-foreground shadow-sm px-4 py-3 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer text-left space-y-2"
        >
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Flame className="w-4 h-4 text-primary" /> {streak}
            </span>
            <span className="text-border">│</span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <CalendarDays className="w-4 h-4 text-accent-foreground" /> {totalDays}
            </span>
            <span className="text-border">│</span>
            <span className="text-muted-foreground">{totalWords} {t('mots', 'words', 'palabras').primary}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            {BADGES.map((badge) => {
              const earned = earnedBadges.some((b) => b.id === badge.id);
              return (
                <span
                  key={badge.id}
                  className={`text-lg transition-all ${earned ? '' : 'opacity-30 grayscale'}`}
                >
                  {badge.icon}
                </span>
              );
            })}
            {(() => {
              const nextBadge = BADGES.find((b) => totalWords < b.threshold);
              if (!nextBadge) return null;
              return (
                <span className="text-xs text-muted-foreground ml-1">
                  ({totalWords}/{nextBadge.threshold})
                </span>
              );
            })()}
          </div>
        </button>

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
              ? t('Écrire encore', 'Write another', 'Escribir más').primary
              : t("Écrire aujourd'hui", 'Write today', 'Escribir hoy').primary
            }
          </Button>

          <Button variant="default" size="full" onClick={onOpenFocusPlan} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Target className="w-5 h-5 mr-2" />
            {bilingual('Un truc à la fois', 'One Thing at a Time', 'Una cosa a la vez')}
          </Button>

          <Button variant="outline" size="full" onClick={onStartFreeWrite}>
            <PenLine className="w-5 h-5 mr-2" />
            {bilingual('Écrire librement', 'Free Write', 'Escritura libre')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenBrainDump}>
            <Zap className="w-5 h-5 mr-2" />
            {bilingual('Vide-tête', 'Brain Dump', 'Volcado mental')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenSmallWins}>
            <Trophy className="w-5 h-5 mr-2" />
            {bilingual('Petites Victoires', 'Small Wins', 'Pequeños Logros')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenThoughtGarden}>
            <Sprout className="w-5 h-5 mr-2" />
            {bilingual('Jardin de pensées', 'Thought Garden', 'Jardín de pensamientos')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenZenGarden}>
            <Mountain className="w-5 h-5 mr-2" />
            {bilingual('Jardin Zen', 'Zen Garden', 'Jardín Zen')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenSandTimer}>
            <Hourglass className="w-5 h-5 mr-2" />
            {bilingual('Sablier', 'Sand Timer', 'Reloj de arena')}
          </Button>

          {/* Vocabulary Progress Card */}
          <button
            onClick={onOpenVocabulary}
            className="w-full rounded-xl border border-border bg-card text-card-foreground p-3 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer text-left flex items-center gap-3"
          >
            <div className="rounded-full bg-primary/10 p-2">
              <Sprout className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium">
                {t('Vocabulaire émotionnel', 'Emotion vocabulary', 'Vocabulario emocional').primary}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('Explorer vos mots', 'Explore your words', 'Explora tus palabras').primary} →
              </p>
            </div>
          </button>

          <p className="text-center text-muted-foreground text-sm pt-2">
            {t('Une ou deux phrases suffisent.', 'One or two sentences is enough.', 'Una o dos frases bastan.').primary}
          </p>
        </div>

      </div>
    </div>
  );
}
