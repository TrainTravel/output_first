import { useJournal } from '@/hooks/useJournal';
import { HomeScreen } from './HomeScreen';
import { BreatheScreen } from './BreatheScreen';
import { WriteScreen } from './WriteScreen';
import { FeedbackScreen } from './FeedbackScreen';
import { EmotionsScreen } from './EmotionsScreen';
import { ReflectionScreen } from './ReflectionScreen';
import { GratitudeScreen } from './GratitudeScreen';
import { ProgressScreen } from './ProgressScreen';
import { ChatScreen } from './ChatScreen';
import { BrainDumpScreen } from './BrainDumpScreen';
import { ThoughtGardenScreen } from './ThoughtGardenScreen';
import { ClustersScreen } from './ClustersScreen';
import { ClusterDetailScreen } from './ClusterDetailScreen';

const STEP_BG_CLASS: Record<string, string> = {
  home: 'journal-step-home',
  breathe: 'journal-step-breathe',
  write: 'journal-step-write',
  feedback: 'journal-step-feedback',
  emotions: 'journal-step-emotions',
  reflection: 'journal-step-reflection',
  gratitude: 'journal-step-gratitude',
  complete: 'journal-step-complete',
};

export function JournalApp() {
  const {
    currentStep,
    currentEntry,
    hasJournaledToday,
    streak,
    totalDays,
    currentCycle,
    canMoveToGratitude,
    getDailyPrompt,
    getGratitudePrompt,
    startJournal,
    finishBreathe,
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
    openBrainDump,
    openThoughtGarden,
    openClusters,
    openClusterDetail,
    activeClusterId,
  } = useJournal();

  const bgClass = STEP_BG_CLASS[currentStep] || '';

  return (
    <div className={`min-h-screen bg-background transition-all duration-1000 ${bgClass}`}>
      {currentStep === 'home' && (
        <HomeScreen
          hasJournaledToday={hasJournaledToday}
          onStartJournal={startJournal}
          onViewProgress={viewProgress}
          onOpenChat={openChat}
          onOpenBrainDump={openBrainDump}
          onOpenThoughtGarden={openThoughtGarden}
          onOpenClusters={openClusters}
        />
      )}

      {currentStep === 'breathe' && (
        <BreatheScreen
          onReady={finishBreathe}
          onBack={goHome}
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
          currentCycle={currentCycle}
          canMoveToGratitude={canMoveToGratitude}
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

      {currentStep === 'braindump' && (
        <BrainDumpScreen onBack={goHome} />
      )}

      {currentStep === 'thoughtgarden' && (
        <ThoughtGardenScreen onBack={goHome} />
      )}

      {currentStep === 'clusters' && (
        <ClustersScreen onBack={goHome} onOpenCluster={openClusterDetail} />
      )}

      {currentStep === 'clusterdetail' && activeClusterId && (
        <ClusterDetailScreen clusterId={activeClusterId} onBack={openClusters} />
      )}
    </div>
  );
}
