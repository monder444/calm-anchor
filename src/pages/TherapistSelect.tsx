import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { therapists, type TherapistPersona } from '@/lib/therapists';
import { ArrowLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';

export default function TherapistSelect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_therapist_preferences')
      .select('selected_therapist_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSelectedId(data.selected_therapist_id);
      });
  }, [user]);

  const handleSelect = async (therapist: TherapistPersona) => {
    if (!user) return;
    // Upsert preference
    await supabase.from('user_therapist_preferences').upsert(
      { user_id: user.id, selected_therapist_id: therapist.id, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    setSelectedId(therapist.id);
    navigate(`/therapist/${therapist.id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-72 h-72 bg-primary/25 -top-20 -right-20" />
      <div className="ambient-orb w-80 h-80 bg-accent/15 bottom-20 -left-32" />

      {/* Header */}
      <div className="px-6 pt-8 pb-2 relative z-10">
        <p className="text-muted-foreground text-sm font-medium">Choose your guide</p>
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mt-0.5">
          AI Therapists
        </h1>
      </div>

      {/* Disclaimer */}
      <div className="px-6 pt-2 pb-1 relative z-10">
        <div className="glass-card rounded-2xl p-3 flex items-start gap-2.5 border border-amber/15">
          <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI wellness coaching — not a substitute for licensed therapy or crisis care.
          </p>
        </div>
      </div>

      {/* Therapist List */}
      <div className="flex-1 px-6 py-4 overflow-y-auto relative z-10 space-y-3">
        {therapists.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(t)}
            className={`w-full glass-card rounded-3xl p-4 flex items-center gap-4 text-left ${
              selectedId === t.id ? 'border-primary/40 glow-primary' : ''
            }`}
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-muted/30">
              <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm">{t.name}</div>
              <div className="text-xs text-primary/80 font-medium">{t.subtitle}</div>
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* Continue with selected */}
      {selectedId && (
        <div className="px-6 pb-2 relative z-10">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/therapist/${selectedId}`)}
            className="w-full h-14 rounded-2xl btn-premium text-primary-foreground font-semibold text-base"
          >
            Continue with {therapists.find(t => t.id === selectedId)?.name}
          </motion.button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
