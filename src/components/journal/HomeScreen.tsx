import { Button } from '@/components/ui/button';
import { Feather, CheckCircle2, BarChart3, MessageCircle, Zap, Sprout, Layers, LogOut } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface HomeScreenProps {
  hasJournaledToday: boolean;
  onStartJournal: () => void;
  onViewProgress: () => void;
  onOpenChat: () => void;
  onOpenBrainDump: () => void;
  onOpenThoughtGarden: () => void;
  onOpenClusters: () => void;
}

export function HomeScreen({ hasJournaledToday, onStartJournal, onViewProgress, onOpenChat, onOpenBrainDump, onOpenThoughtGarden, onOpenClusters }: HomeScreenProps) {
  const { bilingual, t, isFr, isEs } = useLanguage();
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
          {user && (
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-1" />
              {t('Déconnexion', 'Sign out', 'Cerrar sesión').primary}
            </Button>
          )}
          {!user && <div />}
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

        {/* Status */}
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
                <span className="text-sm font-medium">{t('Terminé', 'Completed', 'Completado').primary}</span>
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                <span className="text-sm font-medium">{t('Pas encore', 'Not started', 'Todavía no').primary}</span>
              </>
            )}
          </div>
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
              ? t('Écrire encore', 'Write another', 'Escribir más').primary
              : t("Écrire aujourd'hui", 'Write today', 'Escribir hoy').primary
            }
          </Button>

          <Button variant="outline" size="full" onClick={onOpenChat}>
            <MessageCircle className="w-5 h-5 mr-2" />
            {bilingual('Conversation', 'Conversation', 'Conversación')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenBrainDump}>
            <Zap className="w-5 h-5 mr-2" />
            {bilingual('Vide-tête', 'Brain Dump', 'Volcado mental')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenThoughtGarden}>
            <Sprout className="w-5 h-5 mr-2" />
            {bilingual('Jardin de pensées', 'Thought Garden', 'Jardín de pensamientos')}
          </Button>

          <Button variant="outline" size="full" onClick={onOpenClusters}>
            <Layers className="w-5 h-5 mr-2" />
            {bilingual('Mes Clusters', 'My Clusters', 'Mis Grupos')}
          </Button>

          <p className="text-center text-muted-foreground text-sm pt-2">
            {t('Une ou deux phrases suffisent.', 'One or two sentences is enough.', 'Una o dos frases bastan.').primary}
          </p>
        </div>

        {/* Progress Link */}
        <div className="text-center pt-4">
          <Button
            variant="ghost"
            onClick={onViewProgress}
            className="text-muted-foreground hover:text-foreground"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('Voir vos progrès', 'View progress', 'Ver tu progreso').primary}
          </Button>
        </div>
      </div>
    </div>
  );
}
