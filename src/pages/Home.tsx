import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { Shield, Scan, Sprout, Settings, Activity, Wifi, Check, ChevronRight, Wind, Footprints, Sun, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { classifyState, generateMockSnapshot } from '@/lib/stress-engine';
import BottomNav from '@/components/BottomNav';
import { useProfile } from '@/hooks/use-profile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ProfileSheet from '@/components/ProfileSheet';

const stateStyles = {
  panic: { bg: 'bg-amber/10', border: 'border-amber/20', text: 'text-amber', glow: 'glow-amber' },
  anxiety: { bg: 'bg-accent/10', border: 'border-accent/20', text: 'text-accent', glow: 'glow-violet' },
  depression: { bg: 'bg-accent/10', border: 'border-accent/20', text: 'text-accent', glow: 'glow-violet' },
  baseline: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', glow: 'glow-primary' },
};

export default function Home() {
  const navigate = useNavigate();
  const app = useAppState();
  const { firstName, initials, avatarUrl } = useProfile();
  const [greeting, setGreeting] = useState('Good evening');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Simulate state
    if (!app.currentState) {
      const snapshot = generateMockSnapshot('baseline');
      const classification = classifyState(snapshot);
      app.setCurrentState(classification);
    }
  }, []);

  const state = app.currentState;
  const style = state ? stateStyles[state.state] : stateStyles.baseline;

  const suggestions = getSuggestions(state?.state || 'baseline');

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb w-72 h-72 bg-primary/30 -top-20 -right-20" />
      <div className="ambient-orb w-96 h-96 bg-accent/20 -bottom-32 -left-32" />

      {/* Header */}
      <div className="px-6 pt-8 pb-2 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setProfileOpen(true)}
            className="relative"
          >
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={firstName} />}
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-display font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.button>
          <div>
            <p className="text-muted-foreground text-sm font-medium">{greeting}</p>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mt-0.5">
              {firstName}
            </h1>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/settings')}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto relative z-10">
        {/* State of Mind Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card rounded-3xl p-6 border ${style.border}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className={`w-4 h-4 ${style.text}`} />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {app.ghostMode ? 'Status' : 'State of Mind'}
            </span>
          </div>
          <h2 className={`text-2xl font-display font-bold ${style.text} mb-1.5`}>
            {state?.label || 'Balanced'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {state?.description || 'You\'re in a good place right now.'}
          </p>
        </motion.div>

        {/* Panic Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => navigate('/shield')}
          className="w-full relative overflow-hidden rounded-3xl h-36 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber/15 via-accent/10 to-primary/15 rounded-3xl" />
          <div className="absolute inset-0 glass-card rounded-3xl" />
          <motion.div
            className="absolute inset-0 rounded-3xl border border-amber/15"
            animate={{ borderColor: ['hsla(38,95%,60%,0.15)', 'hsla(38,95%,60%,0.35)', 'hsla(38,95%,60%,0.15)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber/15 flex items-center justify-center">
              <Shield className="w-8 h-8 text-amber" />
            </div>
            <div className="text-left">
              <div className="text-xl font-display font-bold text-foreground">
                {app.ghostMode ? 'Quick Action' : 'Panic Shield'}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {app.ghostMode ? 'Tap to start' : 'Tap for instant support'}
              </div>
            </div>
          </div>
        </motion.button>

        {/* Suggestions */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
            Suggested for You
          </h3>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(s.route)}
                className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-lg">
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm">{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-6 py-3 border-t border-border/50 relative z-10">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {app.wearableConnected ? <Wifi className="w-3.5 h-3.5 text-primary" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{app.wearableConnected ? 'Connected' : 'No Wearable'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {app.vibeScanCalibrated ? <Check className="w-3.5 h-3.5 text-primary" /> : <Scan className="w-3.5 h-3.5" />}
            <span>{app.vibeScanCalibrated ? 'Calibrated' : 'Not Calibrated'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-primary" />
            <span>{app.completedWins} wins</span>
          </div>
        </div>
      </div>

      <BottomNav />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

function getSuggestions(state: string) {
  switch (state) {
    case 'panic':
      return [
        { emoji: '🛡️', label: 'Activate Shield', desc: 'Immediate grounding support', route: '/shield' },
        { emoji: '📷', label: 'Run VibeScan', desc: 'Check your stress markers', route: '/vibescan' },
      ];
    case 'anxiety':
      return [
        { emoji: '🫁', label: '2-min Box Breathing', desc: 'Calm your nervous system', route: '/nudge' },
        { emoji: '📷', label: 'Run VibeScan', desc: 'Monitor your state', route: '/vibescan' },
        { emoji: '🚶', label: '5-minute Walk', desc: 'Gentle movement helps', route: '/nudge' },
      ];
    case 'depression':
      return [
        { emoji: '🌱', label: '1% Win', desc: 'One small step forward', route: '/anchor' },
        { emoji: '☀️', label: '1-min Sunlight', desc: 'A tiny dose of light', route: '/anchor' },
      ];
    default:
      return [
        { emoji: '📷', label: 'Run VibeScan', desc: 'Quick stress check', route: '/vibescan' },
        { emoji: '🌱', label: 'Complete a 1% Win', desc: 'Keep your streak going', route: '/anchor' },
        { emoji: '🫁', label: 'Box Breathing', desc: '2-minute calm exercise', route: '/nudge' },
        { emoji: '🧘', label: 'Guided Meditations', desc: '5–20 minute mindfulness practices', route: '/meditations' },
      ];
  }
}
