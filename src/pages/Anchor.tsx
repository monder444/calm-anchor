import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { ArrowLeft, Check, Sprout, Armchair, Wind as WindIcon, Music, Sun, Droplets, StretchHorizontal, Heart, Headphones } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const microTasks: { id: string; icon: LucideIcon; label: string; desc: string; nav?: string }[] = [
  { id: 'sit', icon: Armchair, label: 'Sit up for 2 minutes', desc: 'Just change your posture gently' },
  { id: 'window', icon: WindIcon, label: 'Open a window', desc: 'Let some fresh air in' },
  { id: 'song', icon: Music, label: 'Listen to 1 upbeat song', desc: 'Music can shift your energy' },
  { id: 'sunlight', icon: Sun, label: '1-minute sunlight', desc: 'Step near a window or outside' },
  { id: 'water', icon: Droplets, label: 'Drink a glass of water', desc: 'Hydration helps everything' },
  { id: 'stretch', icon: StretchHorizontal, label: 'Stretch for 1 minute', desc: 'Move what feels ready to move' },
  { id: 'breathe', icon: WindIcon, label: 'Take 5 deep breaths', desc: 'Slow and steady' },
  { id: 'gratitude', icon: Heart, label: 'Name 1 good thing today', desc: 'Even the smallest counts' },
  { id: 'meditate', icon: Headphones, label: 'Listen to a Guided Meditation', desc: 'Free mindfulness audio', nav: '/meditations' },
];

export default function Anchor() {
  const navigate = useNavigate();
  const app = useAppState();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const handleComplete = (task: typeof microTasks[0]) => {
    if (task.nav) {
      navigate(task.nav);
      return;
    }
    if (completed.has(task.id)) return;
    setCompleted(prev => new Set(prev).add(task.id));
    app.completeWin();
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-72 h-72 bg-primary/20 -top-20 -right-20" />
      <div className="ambient-orb w-64 h-64 bg-accent/10 bottom-20 -left-20" />

      {/* Header */}
      <div className="px-6 pt-6 flex items-center gap-4 relative z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div>
          <h1 className="text-lg font-display font-semibold text-foreground">The Anchor</h1>
          <p className="text-xs text-muted-foreground">1% Wins — small steps count</p>
        </div>
      </div>

      {/* Plant Growth */}
      <div className="px-6 py-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 flex items-center gap-5"
        >
          <div className="relative">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sprout className="w-12 h-12 text-primary" />
            </motion.div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2 font-medium">Your growth</p>
            <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }}
                animate={{ width: `${app.plantGrowth}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{app.completedWins} wins completed</p>
          </div>
        </motion.div>
      </div>

      {/* Tasks */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto relative z-10">
        <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
          Today's Micro-Tasks
        </h3>
        <div className="space-y-3">
          {microTasks.map((task, i) => {
            const isDone = completed.has(task.id);
            return (
              <motion.button
                key={task.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleComplete(task)}
                className={`w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left transition-all ${
                  isDone ? 'opacity-50' : ''
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${
                  isDone ? 'bg-primary/15' : 'bg-muted/50'
                }`}>
                  {isDone ? <Check className="w-5 h-5 text-primary" /> : <task.icon className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-sm ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{task.desc}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
