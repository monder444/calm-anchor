import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, Shield, Bell, Ghost, AlertTriangle, RotateCcw, LogOut, ChevronRight, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const app = useAppState();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      <div className="px-6 pt-4 flex items-center gap-4 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto">
        {/* Shield Mode */}
        <Section title="Crisis Settings">
          <SettingRow
            icon={<Shield className="w-5 h-5 text-primary" />}
            label="Shield Mode"
            value={app.shieldMode === 'brave' ? 'Brave Voice' : 'Grounding Guide'}
            onClick={() => app.setShieldMode(app.shieldMode === 'brave' ? 'safety' : 'brave')}
          />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow
            icon={<Bell className="w-5 h-5 text-primary" />}
            label="Notification Style"
            value={app.notificationStyle === 'both' ? 'Haptic + Visual' : app.notificationStyle === 'haptic' ? 'Haptic Only' : 'Visual Only'}
            onClick={() => {
              const next = app.notificationStyle === 'both' ? 'haptic' : app.notificationStyle === 'haptic' ? 'visual' : 'both';
              app.setNotificationStyle(next);
            }}
          />
          <div className="px-4 py-3">
            <label className="text-sm text-muted-foreground mb-2 block">Sensitivity (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => app.setSensitivity(n)}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all ${
                    app.sensitivity === n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {n}
                </motion.button>
              ))}
            </div>
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <SettingRow
            icon={<Ghost className="w-5 h-5 text-accent" />}
            label="Ghost Mode"
            value={app.ghostMode ? 'On' : 'Off'}
            onClick={() => app.setGhostMode(!app.ghostMode)}
          />
        </Section>

        {/* Safety */}
        <Section title="Safety">
          <SettingRow
            icon={<AlertTriangle className="w-5 h-5 text-amber" />}
            label="Emergency Information"
            value=""
            onClick={() => navigate('/safety')}
          />
        </Section>

        {/* Account */}
        <Section title="Account">
          <div className="px-4 py-3">
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={async () => { await signOut(); navigate('/auth'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <LogOut className="w-5 h-5 text-destructive-foreground" />
            <span className="text-sm text-destructive-foreground font-medium">Sign Out</span>
          </motion.button>
        </Section>

        {/* Reset */}
        <Section title="Data">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { app.resetOnboarding(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Reset Onboarding</span>
          </motion.button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">{title}</h3>
      <div className="glass rounded-2xl overflow-hidden divide-y divide-border">{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
    >
      {icon}
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </motion.button>
  );
}
