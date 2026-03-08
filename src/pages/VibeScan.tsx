import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { classifyState, generateMockSnapshot } from '@/lib/stress-engine';
import { ArrowLeft, Camera, VideoOff } from 'lucide-react';

const messages = [
  { time: 10, text: 'Connecting to your rhythm…' },
  { time: 20, text: 'I see you. Analyzing physiological markers…' },
  { time: 30, text: 'Almost there. Keep your shoulders soft.' },
];

export default function VibeScan() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();
  const app = useAppState();

  const currentMessage = messages.find((m, i) => {
    const next = messages[i + 1];
    return progress <= (next?.time ?? 31);
  })?.text || messages[0].text;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

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

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 30) {
          clearInterval(interval);
          stopCamera();
          const snapshot = generateMockSnapshot();
          const classification = classifyState(snapshot, undefined, undefined, app.sensitivity);
          app.setCurrentState(classification);
          setDone(true);
          return 30;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [scanning]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const state = app.currentState;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-80 h-80 bg-primary/20 -top-24 right-0" />
      <div className="ambient-orb w-64 h-64 bg-accent/15 bottom-20 -left-20" />

      {/* Header */}
      <div className="px-6 pt-6 flex items-center gap-4 relative z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { stopCamera(); navigate(-1); }}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-lg font-display font-semibold text-foreground">VibeScan AI</h1>
      </div>

      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <AnimatePresence mode="wait">
          {!scanning && !done && (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-8">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border border-primary/15"
                  animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.4, 0.15] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                />
                <div className="absolute inset-8 rounded-full bg-muted/30 border-2 border-dashed border-primary/25 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary/50" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">Ready to Scan</h2>
              <p className="text-muted-foreground mb-8 max-w-xs leading-relaxed">
                Position your face within the oval. The scan takes 30 seconds.
              </p>
              {cameraError && (
                <div className="flex items-center gap-2 text-destructive text-sm mb-4 max-w-xs mx-auto">
                  <VideoOff className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStartScan}
                className="w-full max-w-xs h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg"
              >
                Start Scan
              </motion.button>
            </motion.div>
          )}

          {scanning && !done && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="relative w-56 h-56 mx-auto mb-8">
                <div className="absolute inset-10 rounded-full overflow-hidden z-10">
                  <video
                    ref={el => {
                      if (el && streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay playsInline muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-primary/15"
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                  />
                ))}
                <motion.div
                  className="absolute inset-4 rounded-full border-4 border-primary/40"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
              </div>
              <div className="w-full max-w-xs mx-auto mb-4">
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${(progress / 30) * 100}%`,
                      background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                    }}
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
              <div className={`glass-card rounded-3xl p-8 mb-6 ${
                state.state === 'panic' ? 'glow-amber' :
                state.state === 'anxiety' ? 'glow-violet' :
                'glow-primary'
              }`}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your State</p>
                <h2 className={`text-3xl font-display font-bold mb-2 ${
                  state.state === 'panic' ? 'text-amber' :
                  state.state === 'anxiety' ? 'text-accent' :
                  'text-primary'
                }`}>{state.label}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{state.description}</p>
              </div>

              {state.state === 'panic' && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/shield')}
                  className="w-full h-16 rounded-2xl bg-amber/15 border border-amber/25 text-amber font-bold text-lg glow-amber">
                  Hold to Ground →
                </motion.button>
              )}
              {state.state === 'anxiety' && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/nudge')}
                  className="w-full h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg">
                  See Coping Cards
                </motion.button>
              )}
              {state.state === 'depression' && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/anchor')}
                  className="w-full h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg">
                  Try a 1% Win
                </motion.button>
              )}
              {state.state === 'baseline' && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/home')}
                  className="w-full h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-lg">
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
