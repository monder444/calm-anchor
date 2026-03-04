import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { ArrowLeft, Check, Sprout } from 'lucide-react';

const microTasks = [
  { id: 'sit', emoji: '🪑', label: 'Sit up for 2 minutes', desc: 'Just change your posture gently' },
  { id: 'window', emoji: '🪟', label: 'Open a window', desc: 'Let some fresh air in' },
  { id: 'song', emoji: '🎵', label: 'Listen to 1 upbeat song', desc: 'Music can shift your energy' },
  { id: 'sunlight', emoji: '☀️', label: '1-minute sunlight', desc: 'Step near a window or outside' },
  { id: 'water', emoji: '💧', label: 'Drink a glass of water', desc: 'Hydration helps everything' },
  { id: 'stretch', emoji: '🙆', label: 'Stretch for 1 minute', desc: 'Move what feels ready to move' },
  { id: 'breathe', emoji: '🌬️', label: 'Take 5 deep breaths', desc: 'Slow and steady' },
  { id: 'gratitude', emoji: '🙏', label: 'Name 1 good thing today', desc: 'Even the smallest counts' },
];

export default function Anchor() {
  const navigate = useNavigate();
  const app = useAppState();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const handleComplete = (id: string) => {
    if (completed.has(id)) return;
    setCompleted(prev => new Set(prev).add(id));
    app.completeWin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 pt-4 flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">The Anchor</h1>
          <p className="text-xs text-muted-foreground">1% Wins — small steps count</p>
        </div>
      </div>

      {/* Plant Growth */}
      <div className="px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 flex items-center gap-5"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sprout className="w-12 h-12 text-primary" />
            </motion.div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Your growth</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${app.plantGrowth}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{app.completedWins} wins completed</p>
          </div>
        </motion.div>
      </div>

      {/* Tasks */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-widest">
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
                onClick={() => handleComplete(task.id)}
                className={`w-full glass rounded-2xl p-4 flex items-center gap-4 text-left transition-all ${
                  isDone ? 'opacity-60' : ''
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                  isDone ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  {isDone ? <Check className="w-5 h-5 text-primary" /> : task.emoji}
                </div>
                <div className="flex-1">
                  <div className={`font-medium text-sm ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{task.desc}</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
