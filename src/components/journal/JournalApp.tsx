import { useJournal } from '@/hooks/useJournal';
import { HomeScreen } from './HomeScreen';
import { WriteScreen } from './WriteScreen';
import { FeedbackScreen } from './FeedbackScreen';
import { EmotionsScreen } from './EmotionsScreen';
import { ReflectionScreen } from './ReflectionScreen';
import { GratitudeScreen } from './GratitudeScreen';
import { ProgressScreen } from './ProgressScreen';
import { ChatScreen } from './ChatScreen';

export function JournalApp() {
  const {
    currentStep,
    currentEntry,
    hasJournaledToday,
    streak,
    totalDays,
    getDailyPrompt,
    getGratitudePrompt,
    startJournal,
    saveContent,
    skipFeedback,
    continuePastFeedback,
    saveEmotion,
    continueFromReflection,
    saveGratitude,
    skipToComplete,
    goHome,
    viewProgress,
    openChat,
  } = useJournal();

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'home' && (
        <HomeScreen
          hasJournaledToday={hasJournaledToday}
          onStartJournal={startJournal}
          onViewProgress={viewProgress}
          onOpenChat={openChat}
        />
      )}

      {currentStep === 'write' && (
        <WriteScreen
          prompt={getDailyPrompt()}
          onSave={saveContent}
          onBack={goHome}
        />
      )}

      {currentStep === 'feedback' && (
        <FeedbackScreen
          journalContent={currentEntry.content || ''}
          onContinue={continuePastFeedback}
          onSkip={skipFeedback}
        />
      )}

      {currentStep === 'emotions' && (
        <EmotionsScreen
          onSave={saveEmotion}
          onBack={() => startJournal()}
        />
      )}

      {currentStep === 'reflection' && (
        <ReflectionScreen
          journalContent={currentEntry.content || ''}
          emotions={currentEntry.emotion}
          emotionsFr={currentEntry.emotionFr}
          onContinue={continueFromReflection}
          onBack={() => saveEmotion(currentEntry.emotion, currentEntry.emotionFr)}
        />
      )}

      {currentStep === 'gratitude' && (
        <GratitudeScreen
          prompt={getGratitudePrompt()}
          onSave={saveGratitude}
          onSkip={skipToComplete}
          onBack={() => continueFromReflection()}
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

      {currentStep === 'chat' && (
        <ChatScreen onBack={goHome} />
      )}
    </div>
  );
}
