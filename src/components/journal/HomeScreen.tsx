import { Button } from '@/components/ui/button';
import { Feather, CheckCircle2, BarChart3 } from 'lucide-react';

interface HomeScreenProps {
  hasJournaledToday: boolean;
  onStartJournal: () => void;
  onViewProgress: () => void;
}

export function HomeScreen({ hasJournaledToday, onStartJournal, onViewProgress }: HomeScreenProps) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-12 animate-fade-in-up">
        {/* Date */}
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm tracking-wide uppercase">
            {formattedDate}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            OutputFirst
          </h1>
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
                <span className="text-sm font-medium">Completed today</span>
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                <span className="text-sm font-medium">Not started</span>
              </>
            )}
          </div>
        </div>

        {/* Main Action */}
        <div className="space-y-4">
          <Button
            variant="default"
            size="full"
            onClick={onStartJournal}
            className="animate-breathe"
          >
            <Feather className="w-5 h-5 mr-2" />
            {hasJournaledToday ? "Write another entry" : "Write today's journal"}
          </Button>

          <p className="text-center text-muted-foreground text-sm">
            One or two sentences is enough.
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
            View your progress
          </Button>
        </div>
      </div>
    </div>
  );
}
