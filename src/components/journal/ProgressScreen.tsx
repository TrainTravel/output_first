import { Button } from '@/components/ui/button';
import { Home, Feather, Flame, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressScreenProps {
  streak: number;
  totalDays: number;
  hasJournaledToday: boolean;
  onGoHome: () => void;
  onStartJournal: () => void;
}

export function ProgressScreen({
  streak,
  totalDays,
  hasJournaledToday,
  onGoHome,
  onStartJournal,
}: ProgressScreenProps) {
  const { t, isFr, isEs } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">
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
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">{totalDays}</p>
            <p className="text-muted-foreground text-sm">{isFr ? "jours d'écriture" : isEs ? 'días de escritura' : 'days journaled'}</p>
            <p className="text-muted-foreground/60 text-xs">{isFr ? 'days journaled' : isEs ? 'days journaled' : "jours d'écriture"}</p>
          </div>
        </div>

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
