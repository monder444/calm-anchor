import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import type { MentalState } from '@/lib/stress-engine';
import { Zap, Cloud, Moon, Heart, Shield, Eye, Lock, Sprout, ChevronRight, Check } from 'lucide-react';

const steps = [
  'mission', 'pulse', 'vibescan', 'calibration', 'shield-config', 'privacy', 'first-anchor'
] as const;

type Step = typeof steps[number];

const slideVariants = {
  enter: { x: 100, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

export default function Onboarding() {
  const [stepIndex, setStepIndex] = useState(0);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const navigate = useNavigate();
  const app = useAppState();
  const currentStep = steps[stepIndex];

  const next = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      app.setOnboarded(true);
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Progress */}
      <div className="px-6 pt-4 flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: i <= stepIndex ? '100%' : '0%' }}
              transition={{ duration: 0.4 }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="flex-1 flex flex-col px-6 py-8"
        >
          {currentStep === 'mission' && (
            <MissionStep
              onSelect={(concern) => { app.setPrimaryConcern(concern); next(); }}
            />
          )}
          {currentStep === 'pulse' && (
            <PulseStep onNext={() => { app.setWearableConnected(true); next(); }} onSkip={next} />
          )}
          {currentStep === 'vibescan' && (
            <VibeScanIntroStep onNext={next} />
          )}
          {currentStep === 'calibration' && (
            <CalibrationStep
              step={calibrationStep}
              onStep={() => {
                if (calibrationStep < 2) setCalibrationStep(calibrationStep + 1);
                else { app.setVibeScanCalibrated(true); next(); }
              }}
            />
          )}
          {currentStep === 'shield-config' && (
            <ShieldConfigStep
              onSelect={(mode) => { app.setShieldMode(mode); next(); }}
            />
          )}
          {currentStep === 'privacy' && (
            <PrivacyStep onNext={next} />
          )}
          {currentStep === 'first-anchor' && (
            <FirstAnchorStep onComplete={next} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MissionStep({ onSelect }: { onSelect: (c: MentalState) => void }) {
  const options: Array<{ id: MentalState; icon: typeof Zap; label: string; emoji: string; desc: string }> = [
    { id: 'panic', icon: Zap, label: 'Panic Attacks', emoji: '⚡', desc: 'Sudden overwhelming fear and physical symptoms' },
    { id: 'anxiety', icon: Cloud, label: 'Anxiety', emoji: '🌫️', desc: 'Persistent worry, tension, and unease' },
    { id: 'depression', icon: Moon, label: 'Depression', emoji: '🌑', desc: 'Low energy, flat mood, feeling stuck' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-2">
        <span className="text-primary text-sm font-medium tracking-widest uppercase">Your Mission</span>
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
        Where do you need the most support today?
      </h1>
      <p className="text-muted-foreground mb-8">
        This helps us personalize your experience. You can always change this later.
      </p>
      <div className="space-y-4 flex-1">
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(opt.id)}
            className="w-full glass rounded-2xl p-5 flex items-center gap-4 text-left transition-all hover:border-primary/40 active:glow-teal"
          >
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl">
              {opt.emoji}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground text-lg">{opt.label}</div>
              <div className="text-sm text-muted-foreground">{opt.desc}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function PulseStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        className="w-28 h-28 rounded-full bg-muted flex items-center justify-center mb-8"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Heart className="w-12 h-12 text-primary" />
      </motion.div>
      <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Connect Your Pulse</h1>
      <p className="text-muted-foreground mb-2 max-w-xs">
        Connect a wearable to enable continuous heart rate and HRV-based stress detection.
      </p>
      <p className="text-sm text-muted-foreground mb-10 max-w-xs">
        Supports Apple Health, Google Fit, Oura, Fitbit, and more.
      </p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full max-w-xs h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg mb-4"
      >
        Connect Wearable
      </motion.button>
      <button onClick={onSkip} className="text-muted-foreground text-sm">
        Skip for now
      </button>
    </div>
  );
}

function VibeScanIntroStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="relative w-40 h-40 mb-8">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="absolute inset-4 rounded-full bg-muted flex items-center justify-center">
          <Eye className="w-12 h-12 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">VibeScan AI</h1>
      <p className="text-muted-foreground mb-3 max-w-xs">
        A 30-second facial scan that reads your physiological stress markers using your camera.
      </p>
      <div className="glass rounded-xl p-4 mb-10 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">100% On-Device</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Video never leaves your phone. Only derived stress scores are stored.
        </p>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full max-w-xs h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
      >
        Got It
      </motion.button>
    </div>
  );
}

function CalibrationStep({ step, onStep }: { step: number; onStep: () => void }) {
  const scans = [
    { label: 'Baseline', desc: 'Sit comfortably and relax for a moment.', icon: '😌' },
    { label: 'Mild Worry', desc: 'Think of a small stressor or concern.', icon: '😟' },
    { label: 'Safe Memory', desc: 'Recall a moment when you felt completely safe.', icon: '🥰' },
  ];
  const current = scans[step];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <span className="text-primary text-sm font-medium tracking-widest uppercase mb-4">
        Calibration {step + 1}/3
      </span>
      <div className="text-6xl mb-6">{current.icon}</div>
      <h1 className="text-2xl font-bold text-foreground mb-3">{current.label}</h1>
      <p className="text-muted-foreground mb-10 max-w-xs">{current.desc}</p>
      <motion.div
        className="w-20 h-20 rounded-full border-4 border-primary/40 flex items-center justify-center mb-8"
        animate={{ scale: [1, 1.15, 1], borderColor: ['hsla(184,100%,50%,0.4)', 'hsla(184,100%,50%,0.8)', 'hsla(184,100%,50%,0.4)'] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="w-3 h-3 rounded-full bg-primary" />
      </motion.div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStep}
        className="w-full max-w-xs h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
      >
        {step < 2 ? 'Complete & Next' : 'Finish Calibration'}
      </motion.button>
    </div>
  );
}

function ShieldConfigStep({ onSelect }: { onSelect: (m: 'brave' | 'safety') => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-2">
        <span className="text-primary text-sm font-medium tracking-widest uppercase">Shield Mode</span>
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
        Choose Your Crisis Companion
      </h1>
      <p className="text-muted-foreground mb-8">
        How would you like to be supported during a panic episode?
      </p>
      <div className="space-y-4 flex-1">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect('brave')}
          className="w-full glass rounded-2xl p-5 text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg text-foreground">Brave Voice</span>
          </div>
          <p className="text-sm text-muted-foreground">
            CBT-inspired audio guidance. Encourages you to lean into sensations and ride the wave. Voice-first, minimal text.
          </p>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect('safety')}
          className="w-full glass rounded-2xl p-5 text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-6 h-6 text-accent" />
            <span className="font-semibold text-lg text-foreground">Grounding Guide</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AR-style grounding exercises. Look around your environment and find objects to anchor yourself in reality.
          </p>
        </motion.button>
      </div>
    </div>
  );
}

function PrivacyStep({ onNext }: { onNext: () => void }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Our Privacy Oath</h1>
      <div className="space-y-4 mb-8 max-w-xs text-left">
        {[
          'Face video never leaves your device',
          'Only derived stress scores are stored',
          'No data sold to third parties, ever',
          'Delete all data anytime from settings',
          'Compliant with EU AI Act principles',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <span className="text-sm text-foreground">{item}</span>
          </div>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setAccepted(true); onNext(); }}
        className="w-full max-w-xs h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
      >
        I Understand
      </motion.button>
    </div>
  );
}

function FirstAnchorStep({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const wins = [
    { id: 'water', emoji: '💧', label: 'Drink a glass of water' },
    { id: 'stretch', emoji: '🙆', label: 'Stretch for 1 minute' },
    { id: 'sunlight', emoji: '☀️', label: '1 minute of sunlight' },
    { id: 'breathe', emoji: '🌬️', label: 'Take 5 deep breaths' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">
          <Sprout className="w-16 h-16 text-primary mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Plant Your First Seed</h1>
        <p className="text-muted-foreground">Pick your first 1% win. Small steps grow into something beautiful.</p>
      </div>
      <div className="space-y-3 flex-1">
        {wins.map((w) => (
          <motion.button
            key={w.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(w.id)}
            className={`w-full glass rounded-2xl p-4 flex items-center gap-4 transition-all ${
              selected === w.id ? 'border-primary/60 glow-teal' : ''
            }`}
          >
            <span className="text-2xl">{w.emoji}</span>
            <span className="font-medium text-foreground">{w.label}</span>
            {selected === w.id && <Check className="w-5 h-5 text-primary ml-auto" />}
          </motion.button>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onComplete}
        disabled={!selected}
        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg mt-6 disabled:opacity-40"
      >
        Let's Begin
      </motion.button>
    </div>
  );
}
