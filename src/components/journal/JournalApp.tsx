import { useAuth } from '@/contexts/AuthContext';
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
import { ZenGardenScreen } from './zen/ZenGardenScreen';
import { VocabularyScreen } from './VocabularyScreen';
import { SandTimerScreen } from './SandTimerScreen';

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
  const { loading } = useAuth();
  const {
    currentStep,
    currentEntry,
    hasJournaledToday,
    streak,
    totalDays,
    currentCycle,
    reflectionCycles,
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
    openZenGarden,
    openSandTimer,
    openVocabulary,
    vocabOrigin,
    openChatWithContext,
    chatContext,
  } = useJournal();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-gentle-pulse">Loading…</p>
      </div>
    );
  }

  const bgClass = STEP_BG_CLASS[currentStep] || '';

  return (
    <div className={`min-h-screen bg-background transition-all duration-1000 ${bgClass}`}>
      {currentStep === 'home' && (
        <HomeScreen
          hasJournaledToday={hasJournaledToday}
          streak={streak}
          totalDays={totalDays}
          onStartJournal={startJournal}
          onViewProgress={viewProgress}
          onOpenChat={openChat}
          onOpenBrainDump={openBrainDump}
          onOpenThoughtGarden={openThoughtGarden}
          onOpenZenGarden={openZenGarden}
          onOpenSandTimer={openSandTimer}
          onOpenVocabulary={() => openVocabulary('home')}
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
          onOpenVocabulary={() => openVocabulary('emotions')}
        />
      )}

      {currentStep === 'reflection' && (
        <ReflectionScreen
          journalContent={currentEntry.content || ''}
          emotions={currentEntry.emotion}
          emotionsFr={currentEntry.emotionFr}
          currentCycle={currentCycle}
          canMoveToGratitude={canMoveToGratitude}
          reflectionCycles={reflectionCycles}
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
          onOpenVocabulary={openVocabulary}
        />
      )}

      {currentStep === 'chat' && (
        <ChatScreen onBack={goHome} context={chatContext} />
      )}

      {currentStep === 'braindump' && (
        <BrainDumpScreen onBack={goHome} />
      )}

      {currentStep === 'thoughtgarden' && (
        <ThoughtGardenScreen onBack={goHome} onOpenChatWithContext={openChatWithContext} onOpenCluster={openClusterDetail} />
      )}

      {currentStep === 'clusters' && (
        <ClustersScreen onBack={goHome} onOpenCluster={openClusterDetail} />
      )}

      {currentStep === 'clusterdetail' && activeClusterId && (
        <ClusterDetailScreen clusterId={activeClusterId} onBack={openClusters} onOpenChatWithContext={openChatWithContext} />
      )}

      {currentStep === 'zengarden' && (
        <ZenGardenScreen onBack={goHome} />
      )}

      {currentStep === 'sandtimer' && (
        <SandTimerScreen onBack={goHome} />
      )}

      {currentStep === 'vocabulary' && (
        <VocabularyScreen onBack={() => {
          if (vocabOrigin === 'emotions') saveEmotion(currentEntry.emotion, currentEntry.emotionFr);
          else if (vocabOrigin === 'complete') viewProgress();
          else goHome();
        }} />
      )}
    </div>
  );
}
