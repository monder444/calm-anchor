import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';

const copingCards = [
  {
    id: 'box-breathing',
    emoji: '🫁',
    title: '2-min Box Breathing',
    desc: 'Breathe in 4s, hold 4s, out 4s, hold 4s. Repeat.',
    duration: 120,
    color: 'primary',
    steps: ['Breathe in… 4 seconds', 'Hold… 4 seconds', 'Breathe out… 4 seconds', 'Hold… 4 seconds'],
  },
  {
    id: 'cold-water',
    emoji: '🧊',
    title: 'Cold Water Splash',
    desc: 'Splash cold water on your face and wrists. The shock activates your dive reflex and calms your heart rate.',
    duration: 60,
    color: 'primary',
    steps: ['Go to a sink', 'Splash cold water on face', 'Hold cold water on wrists', 'Take a slow breath'],
  },
  {
    id: 'walk',
    emoji: '🚶',
    title: '5-minute Walk',
    desc: 'Walk slowly and notice your feet touching the ground. Count your steps if it helps.',
    duration: 300,
    color: 'primary',
    steps: ['Stand up slowly', 'Walk at a gentle pace', 'Feel each footstep', 'Notice your surroundings'],
  },
];

export default function Nudge() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-72 h-72 bg-accent/15 -top-20 -left-20" />
      <div className="ambient-orb w-64 h-64 bg-primary/15 bottom-20 -right-20" />

      <div className="px-6 pt-6 flex items-center gap-4 relative z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div>
          <h1 className="text-lg font-display font-semibold text-foreground">The Nudge</h1>
          <p className="text-xs text-muted-foreground">Quick coping exercises</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 space-y-4 relative z-10">
        {copingCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {activeCard === card.id ? (
              <ActiveCopingCard card={card} onClose={() => setActiveCard(null)} />
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCard(card.id)}
                className="w-full glass-card rounded-3xl p-6 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl">
                    {card.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{card.title}</div>
                    <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{card.desc}</div>
                  </div>
                </div>
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ActiveCopingCard({ card, onClose }: { card: typeof copingCards[0]; onClose: () => void }) {
  const [seconds, setSeconds] = useState(card.duration);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const stepDuration = (card.duration / card.steps.length) * 1000;
    const iv = setInterval(() => {
      setStepIndex(i => (i + 1) % card.steps.length);
    }, stepDuration);
    return () => clearInterval(iv);
  }, [running, card]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      layoutId={card.id}
      className="glass-card rounded-3xl p-6 glow-primary"
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{card.emoji}</span>
        <h3 className="font-semibold text-foreground flex-1 font-display">{card.title}</h3>
        <button onClick={onClose} className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors">Close</button>
      </div>

      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-primary font-mono tracking-wider">
          {mins}:{secs.toString().padStart(2, '0')}
        </div>
      </div>

      <motion.p
        key={stepIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-foreground font-medium mb-6"
      >
        {card.steps[stepIndex]}
      </motion.p>

      <div className="flex items-center justify-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setSeconds(card.duration); setStepIndex(0); setRunning(false); }}
          className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center"
        >
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setRunning(!running)}
          className="w-16 h-16 rounded-full btn-premium flex items-center justify-center"
        >
          {running ? <Pause className="w-7 h-7 text-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground ml-1" />}
        </motion.button>
      </div>
    </motion.div>
  );
}
