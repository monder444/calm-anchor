import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { classifyState, generateMockSnapshot } from '@/lib/stress-engine';
import { ArrowLeft, Camera } from 'lucide-react';

const messages = [
  { time: 10, text: 'Connecting to your rhythm…' },
  { time: 20, text: 'I see you. Analyzing physiological markers…' },
  { time: 30, text: 'Almost there. Keep your shoulders soft.' },
];

export default function VibeScan() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const app = useAppState();

  const currentMessage = messages.find((m, i) => {
    const next = messages[i + 1];
    return progress <= (next?.time ?? 31);
  })?.text || messages[0].text;

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 30) {
          clearInterval(interval);
          const snapshot = generateMockSnapshot();
          const classification = classifyState(snapshot);
          app.setCurrentState(classification);
          setDone(true);
          return 30;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [scanning]);

  const state = app.currentState;

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
        <h1 className="text-lg font-semibold text-foreground">VibeScan AI</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {!scanning && !done && (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-8">
                {/* Breathing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border border-primary/20"
                  animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                />
                {/* Face oval */}
                <div className="absolute inset-8 rounded-full bg-muted/50 border-2 border-dashed border-primary/30 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary/50" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Scan</h2>
              <p className="text-muted-foreground mb-8 max-w-xs">
                Position your face within the oval. The scan takes 30 seconds.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setScanning(true)}
                className="w-full max-w-xs h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
              >
                Start Scan
              </motion.button>
            </motion.div>
          )}

          {scanning && !done && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="relative w-56 h-56 mx-auto mb-8">
                {/* Pulse ripples */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-primary/20"
                    animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                  />
                ))}
                {/* Breathing ring */}
                <motion.div
                  className="absolute inset-4 rounded-full border-4 border-primary/50"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                {/* Face area */}
                <div className="absolute inset-10 rounded-full bg-muted/30 border border-primary/20 flex items-center justify-center">
                  <motion.div
                    className="w-4 h-4 rounded-full bg-primary"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
              </div>
              {/* Progress */}
              <div className="w-full max-w-xs mx-auto mb-4">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(progress / 30) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{progress}s / 30s</p>
              <motion.p
                key={currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-foreground font-medium"
              >
                {currentMessage}
              </motion.p>
            </motion.div>
          )}

          {done && state && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full">
              <div className={`glass rounded-3xl p-8 mb-6 ${
                state.state === 'panic' ? 'glow-amber' :
                state.state === 'anxiety' ? 'glow-violet' :
                'glow-teal'
              }`}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your State</p>
                <h2 className={`text-3xl font-bold mb-2 ${
                  state.state === 'panic' ? 'text-amber' :
                  state.state === 'anxiety' ? 'text-accent' :
                  'text-primary'
                }`}>{state.label}</h2>
                <p className="text-muted-foreground text-sm">{state.description}</p>
              </div>

              {state.state === 'panic' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/shield')}
                  className="w-full h-16 rounded-2xl bg-amber/20 border border-amber/30 text-amber font-bold text-lg glow-amber"
                >
                  Hold to Ground →
                </motion.button>
              )}
              {state.state === 'anxiety' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/nudge')}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
                >
                  See Coping Cards
                </motion.button>
              )}
              {state.state === 'depression' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/anchor')}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
                >
                  Try a 1% Win
                </motion.button>
              )}
              {state.state === 'baseline' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/home')}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
                >
                  Back to Home
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
