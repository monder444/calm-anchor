import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { useSpeech } from '@/hooks/use-speech';
import { X, Shield as ShieldIcon, Volume2, VolumeX } from 'lucide-react';

const braveSteps = [
  { text: "Hey… you're safe. This is just your body's alarm — it can't hurt you.", duration: 9000 },
  { text: "Let the feelings be there. Don't fight them. Let the wave rise gently.", duration: 9000 },
  { text: "Now breathe in with me… slowly… four seconds…", duration: 6000 },
  { text: "Hold it softly… four seconds…", duration: 5000 },
  { text: "And breathe out… nice and slow… six seconds…", duration: 7000 },
  { text: "Good. The wave is already passing. You're still here.", duration: 8000 },
  { text: "Feel your feet on the ground. You are anchored, right here.", duration: 8000 },
  { text: "One more gentle breath. You're doing so well.", duration: 7000 },
];

const groundingPrompts = [
  { text: "Look around. Find 3 blue objects and tap when ready.", action: "I found them" },
  { text: "Now find a square shape near you. Tap when you see it.", action: "I see it" },
  { text: "Touch something soft. Feel its texture. Tap when done.", action: "Done" },
  { text: "Listen carefully. What's the quietest sound you can hear?", action: "I hear it" },
  { text: "Take a slow breath. You are safe. You are here.", action: "I'm here" },
];

function MuteToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className="absolute top-6 left-6 w-12 h-12 rounded-2xl glass-card flex items-center justify-center"
      aria-label={muted ? 'Unmute voice' : 'Mute voice'}
    >
      {muted ? (
        <VolumeX className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Volume2 className="w-5 h-5 text-primary" />
      )}
    </motion.button>
  );
}

export default function ShieldPage() {
  const navigate = useNavigate();
  const app = useAppState();
  const mode = app.shieldMode;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-96 h-96 bg-amber/15 top-1/4 -right-32" />
      <div className="ambient-orb w-72 h-72 bg-primary/15 -bottom-20 -left-20" />
      {mode === 'brave' ? <BraveMode onExit={() => navigate('/home')} /> : <SafetyMode onExit={() => navigate('/home')} />}
    </div>
  );
}

function BraveMode({ onExit }: { onExit: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [heartbeatSpeed, setHeartbeatSpeed] = useState(0.8);
  const app = useAppState();
  const { speak, stop } = useSpeech();
  const current = braveSteps[stepIndex];

  useEffect(() => {
    if (!app.voiceMuted) {
      speak(current.text);
    }
  }, [stepIndex, app.voiceMuted]);

  useEffect(() => {
    if (stepIndex >= braveSteps.length) return;
    const timer = setTimeout(() => {
      if (stepIndex < braveSteps.length - 1) {
        setStepIndex(stepIndex + 1);
        setHeartbeatSpeed(prev => Math.min(2, prev + 0.15));
      }
    }, current.duration);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  const handleExit = () => {
    stop();
    onExit();
  };

  const done = stepIndex >= braveSteps.length - 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
      <MuteToggle muted={app.voiceMuted} onToggle={() => { if (!app.voiceMuted) stop(); app.setVoiceMuted(!app.voiceMuted); }} />

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleExit}
        className="absolute top-6 right-6 w-12 h-12 rounded-2xl glass-card flex items-center justify-center"
      >
        <X className="w-6 h-6 text-muted-foreground" />
      </motion.button>

      {/* Heartbeat pulse */}
      <motion.div
        className="w-36 h-36 rounded-full bg-amber/8 border-2 border-amber/20 flex items-center justify-center mb-12"
        animate={{ scale: [1, 1.1, 1, 1.05, 1] }}
        transition={{ duration: heartbeatSpeed, repeat: Infinity }}
      >
        <motion.div
          className="w-22 h-22 rounded-full bg-amber/12 flex items-center justify-center"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: heartbeatSpeed, repeat: Infinity, delay: 0.1 }}
        >
          <ShieldIcon className="w-10 h-10 text-amber" />
        </motion.div>
      </motion.div>

      <div className="flex items-center gap-2 mb-6">
        <Volume2 className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Brave Voice</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={stepIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="text-center text-xl font-display font-medium text-foreground leading-relaxed max-w-sm tracking-wide"
        >
          {current.text}
        </motion.p>
      </AnimatePresence>

      {done && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExit}
          className="mt-12 h-14 px-10 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg"
        >
          I Feel Better
        </motion.button>
      )}
    </div>
  );
}

function SafetyMode({ onExit }: { onExit: () => void }) {
  const [promptIndex, setPromptIndex] = useState(0);
  const app = useAppState();
  const { speak, stop } = useSpeech();
  const current = groundingPrompts[promptIndex];
  const done = promptIndex >= groundingPrompts.length;

  useEffect(() => {
    if (!done && !app.voiceMuted) {
      speak(current.text);
    }
  }, [promptIndex, app.voiceMuted]);

  const handleExit = () => {
    stop();
    onExit();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
      <MuteToggle muted={app.voiceMuted} onToggle={() => { if (!app.voiceMuted) stop(); app.setVoiceMuted(!app.voiceMuted); }} />

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleExit}
        className="absolute top-6 right-6 w-12 h-12 rounded-2xl glass-card flex items-center justify-center"
      >
        <X className="w-6 h-6 text-muted-foreground" />
      </motion.button>

      <div className="flex items-center gap-2 mb-8">
        <ShieldIcon className="w-5 h-5 text-primary" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Grounding Guide</span>
      </div>

      {!done ? (
        <>
          <AnimatePresence mode="wait">
            <motion.p
              key={promptIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center text-xl font-display font-medium text-foreground leading-relaxed max-w-sm mb-12 tracking-wide"
            >
              {current.text}
            </motion.p>
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setPromptIndex(promptIndex + 1)}
            className="w-full max-w-xs h-20 rounded-3xl bg-primary/12 border-2 border-primary/25 text-primary font-bold text-xl"
          >
            {current.action}
          </motion.button>

          <p className="text-xs text-muted-foreground mt-6 font-medium">
            Step {promptIndex + 1} of {groundingPrompts.length}
          </p>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="text-5xl mb-6">🌊</div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">The wave has passed</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">You stayed present. You did it.</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleExit}
            className="h-14 px-10 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg"
          >
            Return Home
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
