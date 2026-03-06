import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, ExternalLink, WifiOff, X } from 'lucide-react';

const MINDFUL_BASE_URL = 'https://www.mindful.org/audio-resources-for-mindfulness-meditation/';

interface MeditationItem {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  duration: string;
  url: string;
}

const meditations: MeditationItem[] = [
  {
    id: 'breathing-5',
    emoji: '🌬️',
    title: '5-Minute Breathing Meditation',
    subtitle: 'Quick reset',
    duration: '5 min',
    url: MINDFUL_BASE_URL,
  },
  {
    id: 'awareness-11',
    emoji: '🧘',
    title: '11-Minute Awareness of Breath',
    subtitle: 'Deeper focus',
    duration: '11 min',
    url: MINDFUL_BASE_URL,
  },
  {
    id: 'breathscape-20',
    emoji: '🌊',
    title: '20-Minute Breathscape Practice',
    subtitle: 'Extended calm',
    duration: '20 min',
    url: MINDFUL_BASE_URL,
  },
];

export default function Meditations() {
  const navigate = useNavigate();
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);
  const [offlineError, setOfflineError] = useState(false);

  const openMeditation = (url: string) => {
    if (!navigator.onLine) {
      setOfflineError(true);
      return;
    }
    setOfflineError(false);
    setWebviewUrl(url);
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
          <h1 className="text-lg font-semibold text-foreground">Guided Meditations</h1>
          <p className="text-xs text-muted-foreground">Ground your mind and body</p>
        </div>
      </div>

      {/* Intro */}
      <div className="px-6 pt-5 pb-2">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          These free practices from Mindful.org help you ground, breathe, and reset.
        </motion.p>
      </div>

      {/* Offline banner */}
      {offlineError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center gap-3"
        >
          <WifiOff className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            Meditations require an internet connection. Please reconnect and try again.
          </p>
        </motion.div>
      )}

      {/* Meditation list */}
      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-3">
        {meditations.map((m, i) => (
          <motion.button
            key={m.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openMeditation(m.url)}
            className="w-full glass rounded-2xl p-5 flex items-center gap-4 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-xl">
              {m.emoji}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground text-sm">{m.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {m.subtitle} · {m.duration}
              </div>
            </div>
            <Play className="w-5 h-5 text-primary shrink-0" />
          </motion.button>
        ))}

        {/* More link */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: meditations.length * 0.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openMeditation(MINDFUL_BASE_URL)}
          className="w-full glass rounded-2xl p-5 flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground text-sm">More Mindful Audio</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Explore additional guided practices
            </div>
          </div>
        </motion.button>
      </div>

      {/* Attribution */}
      <div className="px-6 py-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          Audio resources provided by{' '}
          <a
            href="https://www.mindful.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            Mindful.org
          </a>
          .
        </p>
      </div>

      {/* In-app webview overlay */}
      {webviewUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-background flex flex-col safe-top safe-bottom"
        >
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setWebviewUrl(null)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </motion.button>
            <span className="text-sm text-muted-foreground truncate flex-1">mindful.org</span>
          </div>
          <iframe
            src={webviewUrl}
            title="Guided Meditation"
            className="flex-1 w-full border-0"
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </motion.div>
      )}
    </div>
  );
}
