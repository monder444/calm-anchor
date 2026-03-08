import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getTherapist } from '@/lib/therapists';
import { ArrowLeft, MessageCircle, AlertTriangle } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const allTopics = [
  { emoji: '😰', label: 'Anxiety' },
  { emoji: '😤', label: 'Stress' },
  { emoji: '🧘', label: 'Meditation' },
  { emoji: '💬', label: 'Just need to talk' },
  { emoji: '😴', label: 'Sleep' },
  { emoji: '🌀', label: 'Overthinking' },
  { emoji: '💼', label: 'Work pressure' },
  { emoji: '💔', label: 'Relationship stress' },
  { emoji: '🪞', label: 'Self-esteem' },
  { emoji: '🔥', label: 'Burnout' },
];

export default function TherapistIntro() {
  const navigate = useNavigate();
  const { therapistId } = useParams<{ therapistId: string }>();
  const therapist = getTherapist(therapistId || 'aria');

  const handleTopicSelect = (topic: string) => {
    navigate(`/therapist/${therapist.id}/chat`, { state: { topic } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-80 h-80 bg-primary/20 -top-24 right-0" />
      <div className="ambient-orb w-72 h-72 bg-accent/15 bottom-32 -left-24" />

      {/* Header */}
      <div className="px-6 pt-6 flex items-center gap-4 relative z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/therapist')}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div>
          <h1 className="text-lg font-display font-semibold text-foreground">{therapist.name}</h1>
          <p className="text-xs text-muted-foreground">{therapist.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 overflow-y-auto relative z-10 flex flex-col items-center">
        {/* Avatar + greeting */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary/20 glow-primary mb-5"
        >
          <img src={therapist.avatar} alt={therapist.name} className="w-full h-full object-cover" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-display font-bold text-foreground text-center mb-2"
        >
          {therapist.greeting.split('.')[0]}.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground text-center mb-6 max-w-xs leading-relaxed"
        >
          {therapist.greeting.split('.').slice(1).join('.').trim() || 'How can I support you today?'}
        </motion.p>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl p-3 flex items-start gap-2.5 mb-6 border border-amber/15 w-full max-w-sm"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            AI wellness guide — not licensed therapy. In crisis? Tap <span className="text-primary font-medium cursor-pointer" onClick={() => navigate('/safety')}>Safety</span>.
          </p>
        </motion.div>

        {/* Topic cards */}
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            What's on your mind?
          </p>
          <div className="flex flex-wrap gap-2">
            {allTopics.map((topic, i) => (
              <motion.button
                key={topic.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTopicSelect(topic.label)}
                className="glass-card rounded-2xl px-3.5 py-2.5 flex items-center gap-2 text-sm text-foreground font-medium"
              >
                <span>{topic.emoji}</span>
                {topic.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/therapist/${therapist.id}/chat`)}
          className="mt-8 w-full max-w-sm h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-base flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Start Session with {therapist.name}
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
}
