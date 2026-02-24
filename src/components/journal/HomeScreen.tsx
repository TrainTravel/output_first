import { Button } from '@/components/ui/button';
import { Feather, CheckCircle2, BarChart3, MessageCircle, Zap } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface HomeScreenProps {
  hasJournaledToday: boolean;
  onStartJournal: () => void;
  onViewProgress: () => void;
  onOpenChat: () => void;
  onOpenBrainDump: () => void;
}

export function HomeScreen({ hasJournaledToday, onStartJournal, onViewProgress, onOpenChat, onOpenBrainDump }: HomeScreenProps) {
  const { t, bilingual, isFr } = useLanguage();
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
        <div className="flex justify-end">
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
            {bilingual('Journaling en français', 'French journaling practice')}
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
                <span className="text-sm font-medium">{bilingual('Terminé', 'Completed')}</span>
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                <span className="text-sm font-medium">{bilingual('Pas encore', 'Not started')}</span>
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
              ? bilingual('Écrire encore', 'Write another')
              : bilingual('Écrire aujourd\'hui', 'Write today')
            }
          </Button>

          <Button
            variant="outline"
            size="full"
            onClick={onOpenChat}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {bilingual('Pratiquer en conversation', 'Practice conversation')}
          </Button>

          <Button
            variant="outline"
            size="full"
            onClick={onOpenBrainDump}
          >
            <Zap className="w-5 h-5 mr-2" />
            {bilingual('Vide-tête', 'Brain Dump')}
          </Button>

          <p className="text-center text-muted-foreground text-sm pt-2">
            {bilingual('Une ou deux phrases suffisent.', 'One or two sentences is enough.')}
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
            {bilingual('Voir vos progrès', 'View progress')}
          </Button>
        </div>
      </div>
    </div>
  );
}
