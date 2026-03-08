import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircleHeart } from 'lucide-react';
import { useAppState } from '@/lib/app-state';

const navItems = [
  { icon: '🏠', label: 'Home', ghostLabel: 'Home', route: '/home' },
  { icon: '📷', label: 'Scan', ghostLabel: 'Camera', route: '/vibescan' },
  { icon: '🌱', label: 'Anchor', ghostLabel: 'Tasks', route: '/anchor' },
  { icon: '💭', label: 'Nudge', ghostLabel: 'Notes', route: '/nudge' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ghostMode } = useAppState();

  return (
    <div className="px-6 pb-4 relative z-10">
      <div className="glass-strong rounded-3xl px-2 py-3 flex items-center justify-around">
        {navItems.map((item) => {
          const active = location.pathname === item.route;
          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-colors ${
                active ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-semibold">{ghostMode ? item.ghostLabel : item.label}</span>
            </motion.button>
          );
        })}
        {/* Therapist tab */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/therapist')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-colors ${
            location.pathname.startsWith('/therapist') ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          }`}
        >
          <MessageCircleHeart className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{ghostMode ? 'Chat' : 'Therapist'}</span>
        </motion.button>
      </div>
    </div>
  );
}
