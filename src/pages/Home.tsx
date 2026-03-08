import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { Shield, Scan, Sprout, Settings, Activity, Wifi, Check, Wind, Footprints, Sun, Brain, Heart, type LucideIcon } from 'lucide-react';
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

    if (!app.currentState) {
      const snapshot = generateMockSnapshot('baseline');
      const classification = classifyState(snapshot);
      app.setCurrentState(classification);
    }
  }, []);

  const state = app.currentState;
  const style = state ? stateStyles[state.state] : stateStyles.baseline;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb w-72 h-72 bg-primary/30 -top-20 -right-20" />
      <div className="ambient-orb w-96 h-96 bg-accent/20 -bottom-32 -left-32" />

      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setProfileOpen(true)}
          >
            <Avatar className="w-16 h-16 shadow-lg">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={firstName} className="object-cover" />}
              <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.button>
          <div>
            <p className="text-muted-foreground text-xs font-medium">{greeting}</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {firstName}
            </h1>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      <div className="flex-1 px-6 pb-3 space-y-6 overflow-y-auto relative z-10">
        {/* Progress / State Card — gradient style matching reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-card rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">
              {app.ghostMode ? 'Status' : 'Your Progress'}
            </span>
            <Activity className={`w-4 h-4 ${style.text}`} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${style.text} mb-1`}>
                {state?.label || 'Balanced'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {state?.description || 'You\'re in a good place right now.'}
              </p>
            </div>
            {/* Wellness gauge — higher = better */}
            <div className="w-14 h-14 relative">
              {(() => {
                const wellness = Math.round(Math.max(0, Math.min(100, 100 - (state?.stressIndex ?? 10))));
                return (
                  <>
                    <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsla(var(--muted), 0.3)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeDasharray={`${wellness * 0.88} 88`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                      {wellness}%
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
          {/* Status chips */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-foreground/5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
              {app.wearableConnected ? <Wifi className="w-3 h-3 text-primary" /> : <Wifi className="w-3 h-3" />}
              <span>{app.wearableConnected ? 'Connected' : 'No Wearable'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
              {app.vibeScanCalibrated ? <Check className="w-3 h-3 text-primary" /> : <Scan className="w-3 h-3" />}
              <span>{app.vibeScanCalibrated ? 'Calibrated' : 'Uncalibrated'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground ml-auto">
              <Sprout className="w-3 h-3 text-primary" />
              <span>{app.completedWins} wins</span>
            </div>
          </div>
        </motion.div>

        {/* Category Grid — matching reference 2x2 */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <CategoryCard
              icon={Shield}
              label={app.ghostMode ? 'Quick Action' : 'Panic Shield'}
              color="amber"
              delay={0.05}
              onClick={() => navigate('/shield')}
            />
            <CategoryCard
              icon={Scan}
              label="VibeScan"
              color="primary"
              delay={0.1}
              onClick={() => navigate('/vibescan')}
            />
            <CategoryCard
              icon={Brain}
              label="Meditations"
              color="accent"
              delay={0.15}
              onClick={() => navigate('/meditations')}
            />
            <CategoryCard
              icon={Heart}
              label={app.ghostMode ? 'Journal' : 'Mental Health'}
              color="secondary"
              delay={0.2}
              onClick={() => navigate('/therapist')}
            />
          </div>
        </div>

        {/* Suggested Actions */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Suggested for You</h3>
          <div className="space-y-2.5">
            {getSuggestions(state?.state || 'baseline').map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(s.route)}
                className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm">{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

const categoryGradients: Record<string, string> = {
  amber: 'radial-gradient(ellipse at 50% 120%, hsla(38, 95%, 60%, 0.35) 0%, hsla(38, 80%, 50%, 0.12) 40%, transparent 70%)',
  primary: 'radial-gradient(ellipse at 50% 120%, hsla(258, 72%, 62%, 0.35) 0%, hsla(258, 60%, 55%, 0.12) 40%, transparent 70%)',
  accent: 'radial-gradient(ellipse at 50% 120%, hsla(275, 65%, 58%, 0.35) 0%, hsla(270, 50%, 50%, 0.12) 40%, transparent 70%)',
  secondary: 'radial-gradient(ellipse at 50% 120%, hsla(230, 55%, 52%, 0.35) 0%, hsla(230, 45%, 45%, 0.12) 40%, transparent 70%)',
};

function CategoryCard({
  icon: Icon,
  label,
  color,
  delay,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="glass-card rounded-3xl p-5 flex flex-col items-center gap-3 text-center aspect-square justify-center relative overflow-hidden"
    >
      {/* Radial glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: categoryGradients[color] || categoryGradients.primary }}
      />
      <div className={`w-16 h-16 rounded-2xl bg-${color}/12 flex items-center justify-center relative z-10`}>
        <Icon className={`w-8 h-8 text-${color}`} />
      </div>
      <span className="text-xs font-semibold text-foreground leading-tight relative z-10">{label}</span>
    </motion.button>
  );
}

function getSuggestions(state: string): { icon: LucideIcon; label: string; desc: string; route: string }[] {
  switch (state) {
    case 'panic':
      return [
        { icon: Shield, label: 'Activate Shield', desc: 'Immediate grounding support', route: '/shield' },
        { icon: Scan, label: 'Run VibeScan', desc: 'Check your stress markers', route: '/vibescan' },
      ];
    case 'anxiety':
      return [
        { icon: Wind, label: '2-min Box Breathing', desc: 'Calm your nervous system', route: '/nudge' },
        { icon: Scan, label: 'Run VibeScan', desc: 'Monitor your state', route: '/vibescan' },
        { icon: Footprints, label: '5-minute Walk', desc: 'Gentle movement helps', route: '/nudge' },
      ];
    case 'depression':
      return [
        { icon: Sprout, label: '1% Win', desc: 'One small step forward', route: '/anchor' },
        { icon: Sun, label: '1-min Sunlight', desc: 'A tiny dose of light', route: '/anchor' },
      ];
    default:
      return [
        { icon: Scan, label: 'Run VibeScan', desc: 'Quick stress check', route: '/vibescan' },
        { icon: Sprout, label: 'Complete a 1% Win', desc: 'Keep your streak going', route: '/anchor' },
        { icon: Wind, label: 'Box Breathing', desc: '2-minute calm exercise', route: '/nudge' },
        { icon: Activity, label: 'Guided Meditations', desc: '5–20 minute mindfulness', route: '/meditations' },
      ];
  }
}
