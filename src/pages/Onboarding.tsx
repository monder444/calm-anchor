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
  enter: { x: 80, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -80, opacity: 0 },
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
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb w-72 h-72 bg-primary/25 -top-20 -right-20" />
      <div className="ambient-orb w-80 h-80 bg-accent/15 -bottom-24 -left-24" />

      {/* Progress */}
      <div className="px-6 pt-6 flex gap-2 relative z-10">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-muted/50">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }}
              initial={{ width: 0 }}
              animate={{ width: i <= stepIndex ? '100%' : '0%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
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
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-1 flex flex-col px-6 py-8 relative z-10"
        >
          {currentStep === 'mission' && (
            <MissionStep onSelect={(concern) => { app.setPrimaryConcern(concern); next(); }} />
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
            <ShieldConfigStep onSelect={(mode) => { app.setShieldMode(mode); next(); }} />
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
      <div className="mb-3">
        <span className="text-primary text-xs font-semibold tracking-widest uppercase">Your Mission</span>
      </div>
      <h1 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight leading-tight">
        Where do you need the most support today?
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        This helps us personalize your experience. You can always change this later.
      </p>
      <div className="space-y-4 flex-1">
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(opt.id)}
            className="w-full glass-card rounded-3xl p-5 flex items-center gap-4 text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-2xl">
              {opt.emoji}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground text-lg">{opt.label}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{opt.desc}</div>
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
        className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-8"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Heart className="w-12 h-12 text-primary" />
      </motion.div>
      <h1 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight">Connect Your Pulse</h1>
      <p className="text-muted-foreground mb-2 max-w-xs leading-relaxed">
        Connect a wearable to enable continuous heart rate and HRV-based stress detection.
      </p>
      <p className="text-sm text-muted-foreground mb-10 max-w-xs">
        Supports Apple Health, Google Fit, Oura, Fitbit, and more.
      </p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full max-w-xs h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg mb-4"
      >
        Connect Wearable
      </motion.button>
      <button onClick={onSkip} className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
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
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="absolute inset-4 rounded-full bg-primary/8 flex items-center justify-center">
          <Eye className="w-12 h-12 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight">VibeScan AI</h1>
      <p className="text-muted-foreground mb-3 max-w-xs leading-relaxed">
        A 30-second facial scan that reads your physiological stress markers using your camera.
      </p>
      <div className="glass-card rounded-2xl p-5 mb-10 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">100% On-Device</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Video never leaves your phone. Only derived stress scores are stored.
        </p>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full max-w-xs h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg"
      >
        Got It
      </motion.button>
    </div>
  );
}

function CalibrationStep({ step, onStep }: { step: number; onStep: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const SCAN_DURATION = 8;

  const scans = [
    { label: 'Baseline', desc: 'Sit comfortably and relax. We\'ll read your resting state.', icon: '😌' },
    { label: 'Mild Worry', desc: 'Think of a small stressor or concern while we scan.', icon: '😟' },
    { label: 'Safe Memory', desc: 'Recall a moment of complete safety and comfort.', icon: '🥰' },
  ];
  const current = scans[step];

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!scanning) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= SCAN_DURATION) {
          clearInterval(interval);
          stopCamera();
          setScanning(false);
          onStep();
          return SCAN_DURATION;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [scanning, stopCamera, onStep]);

  const handleStartScan = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera in your browser settings.');
      } else {
        setCameraError('Could not access camera. Check permissions.');
      }
    }
  };

  const scanMessages = [
    'Reading facial micro-expressions…',
    'Measuring skin tone variations…',
    'Analyzing physiological markers…',
  ];
  const currentMessage = scanMessages[Math.min(Math.floor(progress / 3), scanMessages.length - 1)];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <span className="text-primary text-xs font-semibold tracking-widest uppercase mb-6">
        Calibration {step + 1}/3
      </span>

      {!scanning ? (
        <>
          <div className="text-6xl mb-6">{current.icon}</div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">{current.label}</h1>
          <p className="text-muted-foreground mb-10 max-w-xs leading-relaxed">{current.desc}</p>
          {cameraError && (
            <p className="text-destructive text-sm mb-4 max-w-xs">{cameraError}</p>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStartScan}
            className="w-full max-w-xs h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg"
          >
            Start Face Scan
          </motion.button>
        </>
      ) : (
        <>
          <div className="relative w-44 h-44 mx-auto mb-6">
            <div className="absolute inset-6 rounded-full overflow-hidden z-10">
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-primary/15"
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              />
            ))}
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-primary/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="w-full max-w-xs mx-auto mb-4">
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${(progress / SCAN_DURATION) * 100}%`,
                  background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                }}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{progress}s / {SCAN_DURATION}s</p>
          <motion.p
            key={currentMessage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-foreground font-medium text-sm"
          >
            {currentMessage}
          </motion.p>
        </>
      )}
    </div>
  );
}

function ShieldConfigStep({ onSelect }: { onSelect: (m: 'brave' | 'safety') => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-3">
        <span className="text-primary text-xs font-semibold tracking-widest uppercase">Shield Mode</span>
      </div>
      <h1 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight leading-tight">
        Choose Your Crisis Companion
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        How would you like to be supported during a panic episode?
      </p>
      <div className="space-y-4 flex-1">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect('brave')}
          className="w-full glass-card rounded-3xl p-6 text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg text-foreground">Brave Voice</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            CBT-inspired audio guidance. Encourages you to lean into sensations and ride the wave. Voice-first, minimal text.
          </p>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect('safety')}
          className="w-full glass-card rounded-3xl p-6 text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-6 h-6 text-accent" />
            <span className="font-semibold text-lg text-foreground">Grounding Guide</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
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
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl font-display font-bold text-foreground mb-4 tracking-tight">Our Privacy Oath</h1>
      <div className="space-y-4 mb-8 max-w-xs text-left">
        {[
          'Face video never leaves your device',
          'Only derived stress scores are stored',
          'No data sold to third parties, ever',
          'Delete all data anytime from settings',
          'Compliant with EU AI Act principles',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm text-foreground leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setAccepted(true); onNext(); }}
        className="w-full max-w-xs h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg"
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
        <motion.div
          className="inline-block mb-4"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sprout className="w-16 h-16 text-primary mx-auto" />
        </motion.div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight">Plant Your First Seed</h1>
        <p className="text-muted-foreground leading-relaxed">Pick your first 1% win. Small steps grow into something beautiful.</p>
      </div>
      <div className="space-y-3 flex-1">
        {wins.map((w) => (
          <motion.button
            key={w.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(w.id)}
            className={`w-full glass-card rounded-2xl p-5 flex items-center gap-4 transition-all ${
              selected === w.id ? 'border-primary/40 glow-primary' : ''
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
        className="w-full h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg mt-6 disabled:opacity-40"
      >
        Let's Begin
      </motion.button>
    </div>
  );
}
