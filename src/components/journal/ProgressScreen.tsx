import { Button } from '@/components/ui/button';
import { Home, Feather, Flame, Calendar } from 'lucide-react';

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
              Vous êtes venu(e) aujourd'hui
            </h1>
            <p className="text-muted-foreground italic">
              You showed up today
            </p>
            <p className="text-muted-foreground text-sm">
              C'est ce qui compte le plus. / That's what matters most.
            </p>
          </div>
        )}

        {!hasJournaledToday && (
          <div className="text-center space-y-4">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              Vos progrès
            </h1>
            <p className="text-muted-foreground italic">
              Your Progress
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
            <p className="text-muted-foreground text-sm">jours de suite</p>
            <p className="text-muted-foreground/60 text-xs">day streak</p>
          </div>

          <div className="bg-card rounded-2xl p-6 text-center shadow-gentle border border-border">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="font-serif text-3xl text-foreground mb-1">{totalDays}</p>
            <p className="text-muted-foreground text-sm">jours d'écriture</p>
            <p className="text-muted-foreground/60 text-xs">days journaled</p>
          </div>
        </div>

        {/* Affirmation */}
        <div className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10">
          <p className="text-foreground font-serif text-lg">
            « Se montrer, c'est déjà réussir. »
          </p>
          <p className="text-muted-foreground text-sm italic mt-2">
            "Showing up counts."
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!hasJournaledToday && (
            <Button
              variant="default"
              size="full"
              onClick={onStartJournal}
            >
              <Feather className="w-5 h-5 mr-2" />
              Écrire aujourd'hui / Write today
            </Button>
          )}
          
          <Button
            variant="gentle"
            size="full"
            onClick={onGoHome}
          >
            <Home className="w-5 h-5 mr-2" />
            Retour à l'accueil / Return home
          </Button>
        </div>
      </div>
    </div>
  );
}
