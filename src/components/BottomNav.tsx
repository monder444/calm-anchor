import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Scan, Sprout, MessageSquare, MessageCircleHeart, type LucideIcon } from 'lucide-react';
import { useAppState } from '@/lib/app-state';

const navItems: { icon: LucideIcon; label: string; ghostLabel: string; route: string }[] = [
  { icon: Home, label: 'Home', ghostLabel: 'Home', route: '/home' },
  { icon: Scan, label: 'Scan', ghostLabel: 'Camera', route: '/vibescan' },
  { icon: Sprout, label: 'Anchor', ghostLabel: 'Tasks', route: '/anchor' },
  { icon: MessageSquare, label: 'Nudge', ghostLabel: 'Notes', route: '/nudge' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ghostMode } = useAppState();

  return (
    <div className="px-5 pb-4 relative z-10">
      <div className="glass-strong rounded-[28px] px-2 py-2.5 flex items-center justify-around">
        {navItems.map((item) => {
          const active = location.pathname === item.route;
          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate(item.route)}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <item.icon className={`w-5 h-5 relative z-10 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-semibold relative z-10 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {ghostMode ? item.ghostLabel : item.label}
              </span>
            </motion.button>
          );
        })}
        {/* Therapist tab */}
        {(() => {
          const active = location.pathname.startsWith('/therapist');
          return (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate('/therapist')}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <MessageCircleHeart className={`w-5 h-5 relative z-10 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-semibold relative z-10 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {ghostMode ? 'Chat' : 'Therapist'}
              </span>
            </motion.button>
          );
        })()}
      </div>
    </div>
  );
}
