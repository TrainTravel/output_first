import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Navigate, Link } from 'react-router-dom';
import { Feather, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function Auth() {
  const { user, loading, signUp, signIn, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === 'forgot') {
      if (!email.trim()) { setSubmitting(false); return; }
      const { error } = await resetPassword(email.trim());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Check your email for a password reset link.');
        setMode('signin');
      }
      setSubmitting(false);
      return;
    }

    if (!email.trim() || !password.trim()) { setSubmitting(false); return; }

    const { error } = mode === 'signup'
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);

    if (error) {
      toast.error(error.message);
    } else if (mode === 'signup') {
      toast.success('Account created! You are now signed in.');
    }
    setSubmitting(false);
  };

  const pageTitle = mode === 'signup' ? 'Sign Up — OutputFirst' : mode === 'forgot' ? 'Reset Password — OutputFirst' : 'Sign In — OutputFirst';
  const pageDesc = mode === 'signup' ? 'Create your OutputFirst account to start journaling.' : mode === 'forgot' ? 'Reset your OutputFirst password.' : 'Sign in to your OutputFirst journal.';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href="https://quiet-words-grow.lovable.app/auth" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content="https://quiet-words-grow.lovable.app/auth" />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
        <div className="text-center space-y-2">
          <Feather className="w-10 h-10 mx-auto text-primary" />
          <h1 className="font-serif text-3xl text-foreground">OutputFirst</h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'signup' && 'Create your account'}
            {mode === 'signin' && 'Sign in to your journal'}
            {mode === 'forgot' && 'Reset your password'}
          </p>
        </div>

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => setMode('signin')}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          {mode !== 'forgot' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          {mode === 'signin' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" size="full" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Sign Up'
                : mode === 'forgot'
                  ? 'Send Reset Link'
                  : 'Sign In'}
          </Button>
        </form>

        {mode !== 'forgot' && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              className="text-primary hover:underline font-medium"
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        )}

        {mode === 'signup' && (
          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
