import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/lib/app-state';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, Shield, Bell, Ghost, AlertTriangle, RotateCcw, LogOut, ChevronRight, Sun, Moon, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function SettingsPage() {
  const navigate = useNavigate();
  const app = useAppState();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-64 h-64 bg-primary/10 -top-16 -right-16" />

      <div className="px-6 pt-6 flex items-center gap-4 mb-6 relative z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-lg font-display font-semibold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto relative z-10">
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
          <div className="px-5 py-4">
            <label className="text-sm text-muted-foreground mb-3 block font-medium">Sensitivity (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => app.setSensitivity(n)}
                  className={`flex-1 h-10 rounded-2xl text-sm font-semibold transition-all ${
                    app.sensitivity === n ? 'btn-premium text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {n}
                </motion.button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-2">
              {app.sensitivity === 1 ? 'Minimal — only extreme signals trigger alerts, very few interruptions' :
               app.sensitivity === 2 ? 'Low — requires clear stress signs, reduces false positives' :
               app.sensitivity === 3 ? 'Balanced — recommended default for most users' :
               app.sensitivity === 4 ? 'Sensitive — picks up early warning signs before they escalate' :
               'Maximum — reacts to the subtlest changes, may alert more often'}
            </p>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow
            icon={app.theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            label="Theme"
            value={app.theme === 'dark' ? 'Dark' : 'Light'}
            onClick={() => app.setTheme(app.theme === 'dark' ? 'light' : 'dark')}
          />
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <div className="flex items-center">
            <SettingRow
              icon={<Ghost className="w-5 h-5 text-accent" />}
              label="Ghost Mode"
              value={app.ghostMode ? 'On' : 'Off'}
              onClick={() => app.setGhostMode(!app.ghostMode)}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="pr-4 -ml-2">
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[200px] text-xs">
                Hides mental-health labels and changes the browser tab title for privacy when others might see your screen.
              </TooltipContent>
            </Tooltip>
          </div>
          {app.ghostMode && (
            <div className="px-5 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ghost Mode hides mental-health related labels throughout the app and changes the browser tab title to "My Notes" for privacy.
              </p>
            </div>
          )}
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
          <div className="px-5 py-3">
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={async () => { await signOut(); navigate('/auth'); }}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive font-semibold">Sign Out</span>
          </motion.button>
        </Section>

        {/* Reset */}
        <Section title="Data">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { app.resetOnboarding(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
          >
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Reset Onboarding</span>
          </motion.button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{title}</h3>
      <div className="glass-card rounded-3xl overflow-hidden divide-y divide-border/40">{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4 text-left"
    >
      {icon}
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      {value && <span className="text-xs text-muted-foreground font-medium">{value}</span>}
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </motion.button>
  );
}
