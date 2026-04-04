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
import { PromptChoiceScreen } from './PromptChoiceScreen';
import { PromptLibraryScreen } from './PromptLibraryScreen';
import { FreeWriteScreen } from './FreeWriteScreen';
import { FreeWriteChoiceScreen } from './FreeWriteChoiceScreen';
import { ExpressiveWriteScreen } from './ExpressiveWriteScreen';
import { SmallWinsScreen } from './SmallWinsScreen';
import { SandTimerScreen } from './SandTimerScreen';
import { FocusPlanScreen } from './FocusPlanScreen';
import { TodoListScreen } from './TodoListScreen';
import { TinyExperimentScreen } from './TinyExperimentScreen';

const STEP_BG_CLASS: Record<string, string> = {
  home: 'journal-step-home',
  breathe: 'journal-step-breathe',
  promptchoice: 'journal-step-write',
  promptlibrary: 'journal-step-write',
  write: 'journal-step-write',
  freewrite: 'journal-step-write',
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
    totalWords,
    earnedBadges,
    promptTemplate,
    currentCycle,
    reflectionCycles,
    canMoveToGratitude,
    getDailyPrompt,
    getGratitudePrompt,
    startJournal,
    finishBreathe,
    chooseDirect,
    openPromptLibrary,
    pickPrompt,
    promptVocab,
    startFreeWrite,
    startPlainFreeWrite,
    startExpressiveWrite,
    saveFreeContent,
    saveContent,
    saveExpressiveContent,
    skipFeedback,
    continuePastFeedback,
    saveEmotion,
    continueFromReflection,
    saveGratitude,
    skipToComplete,
    goHome,
    goBackToWrite,
    viewProgress,
    openChat,
    openBrainDump,
    openThoughtGarden,
    openClusters,
    openClusterDetail,
    activeClusterId,
    openSmallWins,
    openZenGarden,
    openSandTimer,
    openFocusPlan,
    openTodoList,
    openTinyExperiment,
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
          totalWords={totalWords}
          earnedBadges={earnedBadges}
          onStartJournal={startJournal}
          onStartFreeWrite={startFreeWrite}
          onViewProgress={viewProgress}
          onOpenChat={openChat}
          onOpenBrainDump={openBrainDump}
          onOpenSmallWins={openSmallWins}
          onOpenThoughtGarden={openThoughtGarden}
          onOpenZenGarden={openZenGarden}
          onOpenSandTimer={openSandTimer}
          onOpenFocusPlan={openFocusPlan}
           onOpenTodoList={openTodoList}
           onOpenTinyExperiment={openTinyExperiment}
          onOpenVocabulary={() => openVocabulary('home')}
        />
      )}

      {currentStep === 'breathe' && (
        <BreatheScreen
          onReady={finishBreathe}
          onBack={goHome}
        />
      )}

      {currentStep === 'promptchoice' && (
        <PromptChoiceScreen
          onChooseDirect={chooseDirect}
          onOpenLibrary={openPromptLibrary}
          onBack={goHome}
        />
      )}

      {currentStep === 'promptlibrary' && (
        <PromptLibraryScreen
          onPickPrompt={pickPrompt}
          onBack={() => chooseDirect()}
        />
      )}

      {currentStep === 'write' && (
        <WriteScreen
          prompt={getDailyPrompt()}
          initialContent={promptTemplate}
          preloadedVocab={promptVocab}
          onSave={saveContent}
          onBack={goHome}
        />
      )}

      {currentStep === 'freewritechoice' && (
        <FreeWriteChoiceScreen
          onChooseFreeWrite={startPlainFreeWrite}
          onChooseExpressive={startExpressiveWrite}
          onBack={goHome}
        />
      )}

      {currentStep === 'freewrite' && (
        <FreeWriteScreen
          onSave={saveFreeContent}
          onBack={goHome}
        />
      )}

      {currentStep === 'expressivewrite' && (
        <ExpressiveWriteScreen
          onSave={saveExpressiveContent}
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
          onBack={goBackToWrite}
          onGoHome={goHome}
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
          totalWords={totalWords}
          earnedBadges={earnedBadges}
          hasJournaledToday={hasJournaledToday}
          onGoHome={goHome}
          onStartJournal={startJournal}
          onOpenVocabulary={openVocabulary}
        />
      )}

      {currentStep === 'chat' && (
        <ChatScreen onBack={goHome} context={chatContext} />
      )}

      {currentStep === 'smallwins' && (
        <SmallWinsScreen onBack={goHome} />
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

      {currentStep === 'focusplan' && (
        <FocusPlanScreen onBack={goHome} />
      )}

      {currentStep === 'todolist' && (
        <TodoListScreen onBack={goHome} />
      )}

      {currentStep === 'tinyexperiment' && (
        <TinyExperimentScreen onBack={goHome} />
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
