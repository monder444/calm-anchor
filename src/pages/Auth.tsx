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
        redirect_uri: `${window.location.origin}/auth`,
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb w-80 h-80 bg-primary/30 -top-24 -right-24" />
      <div className="ambient-orb w-96 h-96 bg-accent/20 -bottom-40 -left-40" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-3xl btn-premium mx-auto mb-5 flex items-center justify-center"
          >
            <span className="text-2xl text-primary-foreground font-display font-bold">A</span>
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Anchor AI</h1>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
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
                    className="w-full glass-card rounded-2xl pl-11 pr-4 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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
              className="w-full glass-card rounded-2xl pl-11 pr-4 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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
                className="w-full glass-card rounded-2xl pl-11 pr-11 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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
              className="text-xs text-primary hover:underline block ml-1 font-medium"
            >
              Forgot password?
            </button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl py-4 btn-premium text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
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

        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-muted-foreground font-medium">or</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full rounded-2xl py-4 glass-card text-foreground font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
            >
              {googleLoading ? (
                <span className="animate-pulse">Connecting…</span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </motion.button>
          </>
        )}

        <div className="text-center mt-8">
          {mode === 'login' && (
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-primary font-semibold hover:underline">
                Sign up
              </button>
            </p>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-primary font-semibold hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
