import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable/index';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast.error(result.error.message || 'Google sign-in failed');
      }
    } catch (err: any) {
      if (err?.message?.includes('cancelled') || err?.message?.includes('popup_closed')) {
        toast.info('Sign-in cancelled');
      } else {
        toast.error(err?.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
      toast.success('Check your email for a reset link');
      setMode('login');
      return;
    }

    if (mode === 'signup') {
      const { error } = await signUp(email, password, displayName);
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
      toast.success('Check your email to confirm your account');
      return;
    }

    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Anchor AI</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === 'login' && 'Welcome back. Sign in to continue.'}
            {mode === 'signup' && 'Create your account to get started.'}
            {mode === 'forgot' && 'Enter your email to reset your password.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Display name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full glass rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 bg-muted"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full glass rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 bg-muted"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full glass rounded-2xl pl-11 pr-11 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 bg-muted"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="text-xs text-primary hover:underline block ml-1"
            >
              Forgot password?
            </button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl py-3.5 bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="animate-pulse">Please wait…</span>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Link'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          {mode === 'login' && (
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">
                Sign up
              </button>
            </p>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-primary font-medium hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
