import { useJournal } from '@/hooks/useJournal';
import { HomeScreen } from './HomeScreen';
import { WriteScreen } from './WriteScreen';
import { EmotionsScreen } from './EmotionsScreen';
import { GratitudeScreen } from './GratitudeScreen';
import { ProgressScreen } from './ProgressScreen';

export function JournalApp() {
  const {
    currentStep,
    hasJournaledToday,
    streak,
    totalDays,
    getDailyPrompt,
    getGratitudePrompt,
    startJournal,
    saveContent,
    saveEmotion,
    saveGratitude,
    skipToComplete,
    goHome,
    viewProgress,
  } = useJournal();

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'home' && (
        <HomeScreen
          hasJournaledToday={hasJournaledToday}
          onStartJournal={startJournal}
          onViewProgress={viewProgress}
        />
      )}

      {currentStep === 'write' && (
        <WriteScreen
          prompt={getDailyPrompt()}
          onSave={saveContent}
          onBack={goHome}
        />
      )}

      {currentStep === 'emotions' && (
        <EmotionsScreen
          onSave={saveEmotion}
          onBack={() => startJournal()}
        />
      )}

      {currentStep === 'gratitude' && (
        <GratitudeScreen
          prompt={getGratitudePrompt()}
          onSave={saveGratitude}
          onSkip={skipToComplete}
          onBack={() => saveEmotion(undefined, undefined)}
        />
      )}

      {currentStep === 'complete' && (
        <ProgressScreen
          streak={streak}
          totalDays={totalDays}
          hasJournaledToday={hasJournaledToday}
          onGoHome={goHome}
          onStartJournal={startJournal}
        />
      )}
    </div>
  );
}
