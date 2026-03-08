import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircleHeart } from 'lucide-react';

const navItems = [
  { icon: '🏠', label: 'Home', route: '/home' },
  { icon: '📷', label: 'Scan', route: '/vibescan' },
  { icon: '🌱', label: 'Anchor', route: '/anchor' },
  { icon: '💭', label: 'Nudge', route: '/nudge' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

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
              <span className="text-[10px] font-semibold">{item.label}</span>
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
          <span className="text-[10px] font-semibold">Therapist</span>
        </motion.button>
      </div>
    </div>
  );
}
