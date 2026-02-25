import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Feather, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [valid, setValid] = useState(false);

  // Check for recovery token in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setValid(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { error } = await updatePassword(password);
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/'), 2000);
    }
    setSubmitting(false);
  };

  if (!valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6 text-center animate-fade-in-up">
          <Feather className="w-10 h-10 mx-auto text-primary" />
          <h1 className="font-serif text-2xl text-foreground">Invalid Reset Link</h1>
          <p className="text-muted-foreground text-sm">
            This link is invalid or has expired. Please request a new password reset.
          </p>
          <Button variant="default" size="full" onClick={() => navigate('/auth')}>
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6 text-center animate-fade-in-up">
          <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
          <h1 className="font-serif text-2xl text-foreground">Password Updated</h1>
          <p className="text-muted-foreground text-sm">Redirecting you now...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
        <div className="text-center space-y-2">
          <Feather className="w-10 h-10 mx-auto text-primary" />
          <h1 className="font-serif text-3xl text-foreground">Set New Password</h1>
          <p className="text-muted-foreground text-sm">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" size="full" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
