import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, WifiOff, Wind, Brain, Waves, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MeditationItem {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  duration: string;
  audioUrl: string;
  color: string;
}

// Free guided meditation audio from UCLA MARC (public domain / freely shared)
const meditations: MeditationItem[] = [
  {
    id: 'breathing-5',
    icon: Wind,
    title: '5-Minute Breathing',
    subtitle: 'Quick reset for your mind',
    duration: '5 min',
    audioUrl: 'https://www.uclahealth.org/sites/default/files/media/2022-09/Breathing-Meditation.mp3',
    color: 'primary',
  },
  {
    id: 'body-scan-11',
    icon: Brain,
    title: 'Body Scan Meditation',
    subtitle: 'Release tension from head to toe',
    duration: '11 min',
    audioUrl: 'https://www.uclahealth.org/sites/default/files/media/2022-09/Body-Scan-Meditation.mp3',
    color: 'accent',
  },
  {
    id: 'loving-kindness',
    icon: Waves,
    title: 'Loving Kindness',
    subtitle: 'Cultivate compassion & warmth',
    duration: '8 min',
    audioUrl: 'https://www.uclahealth.org/sites/default/files/media/2022-09/Loving-Kindness-Meditation.mp3',
    color: 'secondary',
  },
];

export default function Meditations() {
  const navigate = useNavigate();
  const [offlineError, setOfflineError] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeMeditation = meditations.find(m => m.id === activeId);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && audio.duration) {
        setCurrentTime(audio.currentTime);
        setTotalDuration(audio.duration);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    }, 250);
  };

  useEffect(() => {
    return () => {
      clearTimer();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playMeditation = async (meditation: MeditationItem) => {
    if (!navigator.onLine) {
      setOfflineError(true);
      return;
    }
    setOfflineError(false);

    // If tapping the same one that's playing, toggle play/pause
    if (activeId === meditation.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        clearTimer();
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        startTimer();
      }
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      clearTimer();
    }

    // Create and play new audio (synchronously in gesture context for iOS)
    const audio = new Audio();
    audio.play().catch(() => {}); // unlock on iOS
    audio.preload = 'auto';
    audio.src = meditation.audioUrl;

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(100);
      clearTimer();
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setActiveId(null);
      clearTimer();
    };

    audioRef.current = audio;
    setActiveId(meditation.id);
    setProgress(0);
    setCurrentTime(0);
    setTotalDuration(0);

    try {
      await audio.play();
      setIsPlaying(true);
      startTimer();
    } catch {
      // Fallback: set src and retry
      audio.src = meditation.audioUrl;
      audio.load();
      audio.oncanplaythrough = async () => {
        try {
          await audio.play();
          setIsPlaying(true);
          startTimer();
        } catch (e) {
          console.error('Playback failed:', e);
        }
      };
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearTimer();
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
      startTimer();
    }
  };

  const seekRelative = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-72 h-72 bg-accent/15 -top-20 -right-20" />
      <div className="ambient-orb w-64 h-64 bg-primary/10 bottom-32 -left-20" />

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
          <h1 className="text-lg font-display font-semibold text-foreground">Guided Meditations</h1>
          <p className="text-xs text-muted-foreground">Ground your mind and body</p>
        </div>
      </div>

      {/* Intro */}
      <div className="px-6 pt-5 pb-2 relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          Free guided practices from UCLA's Mindful Awareness Research Center. Tap to play directly in the app.
        </motion.p>
      </div>

      {/* Offline banner */}
      {offlineError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 relative z-10"
        >
          <WifiOff className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            Meditations require an internet connection. Please reconnect and try again.
          </p>
        </motion.div>
      )}

      {/* Meditation list */}
      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-3 relative z-10">
        {meditations.map((m, i) => {
          const isActive = activeId === m.id;
          return (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => playMeditation(m)}
              className={`w-full glass-card rounded-3xl p-5 flex items-center gap-4 text-left transition-all ${
                isActive ? 'ring-2 ring-primary/40' : ''
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-${m.color}/10 flex items-center justify-center relative`}>
                <m.icon className={`w-6 h-6 text-${m.color}`} />
                {isActive && isPlaying && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-primary/40"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm">{m.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {m.subtitle} · {m.duration}
                </div>
                {/* Progress bar for active meditation */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 h-1 rounded-full bg-muted/30 overflow-hidden"
                  >
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </motion.div>
                )}
              </div>
              {isActive && isPlaying ? (
                <Pause className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Play className="w-5 h-5 text-primary shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Mini player bar */}
      <AnimatePresence>
        {activeMeditation && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="mx-4 mb-4 glass-strong rounded-3xl p-4 relative z-10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{activeMeditation.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {formatTime(currentTime)} / {totalDuration ? formatTime(totalDuration) : activeMeditation.duration}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => seekRelative(-15)} className="w-9 h-9 flex items-center justify-center">
                  <SkipBack className="w-4 h-4 text-foreground" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={togglePlayPause} className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                  {isPlaying ? <Pause className="w-5 h-5 text-primary-foreground" /> : <Play className="w-5 h-5 text-primary-foreground ml-0.5" />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => seekRelative(15)} className="w-9 h-9 flex items-center justify-center">
                  <SkipForward className="w-4 h-4 text-foreground" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution */}
      <div className="px-6 py-3 text-center relative z-10">
        <p className="text-[11px] text-muted-foreground">
          Audio from{' '}
          <a href="https://www.uclahealth.org/programs/marc/free-guided-meditations" target="_blank" rel="noopener noreferrer" className="underline text-primary">
            UCLA MARC
          </a>{' '}
          — freely available for personal use.
        </p>
      </div>
    </div>
  );
}
