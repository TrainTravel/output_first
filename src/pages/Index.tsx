import { JournalApp } from '@/components/journal/JournalApp';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>OutputFirst - Daily Journaling for Emotional Awareness</title>
        <meta name="description" content="A calm, private journaling app that helps you build a daily habit of expression while improving emotional awareness and gratitude." />
      </Helmet>
      <JournalApp />
    </>
  );
};

export default Index;
