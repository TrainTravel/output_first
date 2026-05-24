import { Link } from 'react-router-dom';
import { Feather, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen px-6 py-12">
      <div className="w-full max-w-2xl mx-auto space-y-10 animate-fade-in-up">

        <div className="space-y-4">
          <Link
            to="/auth"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <Feather className="w-7 h-7 text-primary" />
            <h1 className="font-serif text-3xl text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground text-sm">Last updated: May 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">The short version</h2>
          <p className="text-muted-foreground leading-relaxed">
            OutputFirst stores your journal entries so you can access them across devices.
            Your content is private to you — we do not read it, sell it, or share it.
            No advertising. No behavioural tracking.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">What we store on our servers</h2>
          <ul className="space-y-2 text-muted-foreground leading-relaxed list-none">
            {[
              ['Email address', 'used only for login and account recovery'],
              ['Journal entries', 'your writing, the emotion you selected, and AI-generated reflections'],
              ['Brain dump thoughts', 'including the theme tag the AI assigns'],
              ['Thought clusters', 'groups and proposals you create'],
              ['Timestamps', 'when entries were created or updated'],
            ].map(([item, desc]) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary mt-1">–</span>
                <span><strong className="text-foreground font-medium">{item}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">What stays on your device only</h2>
          <ul className="space-y-2 text-muted-foreground leading-relaxed list-none">
            {[
              'Language pair preference (e.g. learn French, speak English)',
              'Garden theme choice',
              'Emotion vocabulary history and frequency counts',
              'Dismissed nudge cards',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary mt-1">–</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm">
            These live in your browser's localStorage. Clearing browser data removes them.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">AI processing</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you request a reflection, writing feedback, or chat response, the relevant
            portion of your entry is sent to an AI model (Gemini 2.5 Flash via Lovable's
            AI gateway). This happens only when you explicitly trigger it — not automatically.
            We do not use your content to train AI models.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">How your data is protected</h2>
          <ul className="space-y-2 text-muted-foreground leading-relaxed list-none">
            {[
              'Row Level Security (RLS) is enforced at the database level — you can only ever read your own data, even if our application code had a bug',
              'All API calls require a valid JWT token tied to your account',
              'Data is stored on Supabase (hosted on AWS), which encrypts data at rest and in transit',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary mt-1">–</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">What we do not do</h2>
          <ul className="space-y-2 text-muted-foreground leading-relaxed list-none">
            {[
              'We do not sell your data to any third party',
              'We do not run advertising or behavioural tracking',
              'We do not use analytics tools (no Google Analytics, Mixpanel, or similar)',
              'We do not share your journal content with other users',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary mt-1">–</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Your rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You can request a copy of your data or ask us to delete your account and all
            associated content at any time. To do so, email us at{' '}
            <a
              href="mailto:train981316@gmail.com"
              className="text-primary hover:underline"
            >
              train981316@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Changes to this policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            If we make material changes, we will notify you by email before they take effect.
          </p>
        </section>

        <div className="pt-4 border-t border-border">
          <p className="text-muted-foreground text-sm text-center">
            Questions?{' '}
            <a href="mailto:train981316@gmail.com" className="text-primary hover:underline">
              train981316@gmail.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
