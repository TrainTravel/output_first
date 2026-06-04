import { JournalApp } from '@/components/journal/JournalApp';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>OutputFirst - Daily Journaling for Emotional Awareness</title>
        <meta name="description" content="A calm, private journaling app that helps you build a daily habit of expression while improving emotional awareness and gratitude." />
        <link rel="canonical" href="https://quiet-words-grow.lovable.app/" />
        <meta property="og:title" content="OutputFirst - Daily Journaling for Emotional Awareness" />
        <meta property="og:description" content="A calm, private journaling app that helps you build a daily habit of expression while improving emotional awareness and gratitude." />
        <meta property="og:url" content="https://quiet-words-grow.lovable.app/" />
      </Helmet>
      <JournalApp />
      <FeedbackWidget />
    </>
  );
};

export default Index;
