import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { ArrowLeft, Camera, VideoOff, ChevronDown } from 'lucide-react';
import type { StressClassification, FaceBiometricSummary } from '@/lib/stress-engine';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getFaceLandmarker,
  newAggregate,
  ingestSample,
  finalize,
  type SampleAggregate,
} from '@/lib/face-biometrics';

const messages = [
  { time: 10, text: 'Tracking facial landmarks…' },
  { time: 20, text: 'Measuring micro-expressions…' },
  { time: 30, text: 'Almost there. Keep your shoulders soft.' },
];

function captureFrame(video: HTMLVideoElement): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 480;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7).split(',')[1] || null;
}

function mapAIResponseToClassification(ai: {
  state: string;
  confidence: number;
  fear: number;
  tension: number;
  flatAffect: number;
  relaxed: number;
  description: string;
  biometrics?: FaceBiometricSummary;
}): StressClassification {
  const state = (['panic', 'anxiety', 'depression', 'baseline'].includes(ai.state)
    ? ai.state
    : 'baseline') as StressClassification['state'];

  const labels: Record<string, { label: string; color: StressClassification['color'] }> = {
    panic: { label: 'High Alert', color: 'amber' },
    anxiety: { label: 'Elevated', color: 'violet' },
    depression: { label: 'Low Energy', color: 'violet' },
    baseline: { label: 'Balanced', color: 'teal' },
  };

  const stressIndexMap: Record<string, number> = {
    panic: Math.min(100, 70 + ai.fear * 30),
    anxiety: Math.min(70, 40 + ai.tension * 30),
    depression: Math.min(50, 20 + ai.flatAffect * 30),
    baseline: Math.max(0, 20 - ai.relaxed * 20),
  };

  return {
    state,
    confidence: ai.confidence,
    stressIndex: stressIndexMap[state] ?? 10,
    label: labels[state]?.label ?? 'Balanced',
    description: ai.description || 'Analysis complete.',
    color: labels[state]?.color ?? 'teal',
    biometrics: ai.biometrics,
  };
}

export default function VibeScan() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aggRef = useRef<SampleAggregate | null>(null);
  const rafRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const app = useAppState();
  const { toast } = useToast();

  const currentMessage = analyzing
    ? 'Fusing biometrics with AI analysis…'
    : messages.find((m, i) => {
        const next = messages[i + 1];
        return progress <= (next?.time ?? 31);
      })?.text || messages[0].text;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const analyzeFace = useCallback(async () => {
    const videoEl = liveVideoRef.current || videoRef.current;
    if (!videoEl || !streamRef.current) {
      toast({ title: 'Camera error', description: 'Could not capture frame.', variant: 'destructive' });
      return;
    }

    const base64 = captureFrame(videoEl);
    if (!base64) {
      toast({ title: 'Capture error', description: 'Failed to capture frame from camera.', variant: 'destructive' });
      return;
    }

    const biometrics = aggRef.current ? finalize(aggRef.current) : undefined;

    setAnalyzing(true);
    stopCamera();

    try {
      const { data, error } = await supabase.functions.invoke('analyze-face', {
        body: { imageBase64: base64, biometrics },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const classification = mapAIResponseToClassification(data);
      app.setCurrentState(classification);
    } catch (err) {
      console.error('Face analysis failed:', err);
      toast({
        title: 'Analysis failed',
        description: 'Could not analyze face. Using fallback assessment.',
        variant: 'destructive',
      });
      app.setCurrentState({
        state: 'baseline',
        confidence: 0.5,
        stressIndex: 15,
        label: 'Balanced',
        description: 'Could not complete facial analysis. Defaulting to balanced state.',
        color: 'teal',
        biometrics,
      });
    } finally {
      setAnalyzing(false);
      setDone(true);
    }
  }, [app, stopCamera, toast]);

  const handleStartScan = async () => {
    setCameraError(null);
    try {
      // Warm up FaceLandmarker in parallel with camera
      getFaceLandmarker().catch(err => console.warn('FaceLandmarker init failed:', err));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      aggRef.current = newAggregate();
      setScanning(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera in your browser settings.');
      } else {
        setCameraError('Could not access camera. Check permissions.');
      }
    }
  };

  // Landmark detection loop
  useEffect(() => {
    if (!scanning || analyzing) return;
    let cancelled = false;
    let landmarker: Awaited<ReturnType<typeof getFaceLandmarker>> | null = null;

    (async () => {
      try {
        landmarker = await getFaceLandmarker();
      } catch (e) {
        console.warn('FaceLandmarker not available; running without biometrics', e);
        return;
      }
      if (cancelled) return;

      const loop = () => {
        if (cancelled) return;
        const v = liveVideoRef.current;
        if (v && v.readyState >= 2 && landmarker && aggRef.current) {
          try {
            const result = landmarker.detectForVideo(v, performance.now());
            ingestSample(aggRef.current, result);

            // Draw overlay dots
            const canvas = overlayCanvasRef.current;
            if (canvas && result.faceLandmarks?.[0]) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'hsla(170, 70%, 60%, 0.7)';
                // Subset of landmarks for clean look
                const KEY = [33,133,159,145,362,263,386,374,10,152,234,454,168,6,197,1];
                for (const i of KEY) {
                  const p = result.faceLandmarks[0][i];
                  // Mirror x because video is scale-x-[-1]
                  const x = (1 - p.x) * canvas.width;
                  const y = p.y * canvas.height;
                  ctx.beginPath();
                  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
          } catch (e) {
            // Detection errors are non-fatal
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    })();

    return () => {
      cancelled = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scanning, analyzing]);

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 30) {
          clearInterval(interval);
          analyzeFace();
          return 30;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [scanning, analyzeFace]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const state = app.currentState;

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-80 h-80 bg-primary/20 -top-24 right-0" />
      <div className="ambient-orb w-64 h-64 bg-accent/15 bottom-20 -left-20" />

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
          {!scanning && !done && !analyzing && (
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
                Position your face within the oval. On-device FaceMesh tracks 468 landmarks while AI analyzes your expression.
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

          {(scanning || analyzing) && !done && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="relative w-56 h-56 mx-auto mb-8">
                <div className="absolute inset-10 rounded-full overflow-hidden z-10">
                  <video
                    ref={el => {
                      liveVideoRef.current = el;
                      if (el && streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay playsInline muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
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
                      width: analyzing ? '100%' : `${(progress / 30) * 100}%`,
                      background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {analyzing ? 'Processing…' : `${progress}s / 30s`}
              </p>
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

              {state.biometrics && (
                <div className="glass-card rounded-2xl mb-6 overflow-hidden text-left">
                  <button
                    onClick={() => setShowBiometrics(s => !s)}
                    className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-foreground"
                  >
                    <span>Biometric signals</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showBiometrics ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showBiometrics && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-4 space-y-2 text-xs text-muted-foreground"
                      >
                        <BioRow label="Eye openness" value={state.biometrics.eyeOpenness} />
                        <BioRow label="Brow tension" value={state.biometrics.browTension} />
                        <BioRow label="Jaw tension" value={state.biometrics.jawTension} />
                        <BioRow label="Mouth tension" value={state.biometrics.mouthTension} />
                        <BioRow label="Head tilt" value={state.biometrics.headTilt} />
                        <div className="flex justify-between pt-1 border-t border-border/30">
                          <span>Blink rate</span>
                          <span className="text-foreground">{state.biometrics.blinkRate.toFixed(1)}/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frames analyzed</span>
                          <span className="text-foreground">{state.biometrics.samples}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

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

function BioRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span className="text-foreground">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60"
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
    </div>
  );
}
