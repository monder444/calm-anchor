import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, AlertTriangle, ExternalLink } from 'lucide-react';

const crisisNumbers = [
  { country: 'US', name: 'National Suicide Prevention Lifeline', number: '988' },
  { country: 'US', name: 'Crisis Text Line', number: 'Text HOME to 741741' },
  { country: 'UK', name: 'Samaritans', number: '116 123' },
  { country: 'EU', name: 'European Emergency', number: '112' },
  { country: 'INT', name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/' },
];

export default function Safety() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col safe-top safe-bottom relative overflow-hidden">
      <div className="ambient-orb w-72 h-72 bg-amber/10 -top-20 -right-20" />

      <div className="px-6 pt-6 flex items-center gap-4 mb-6 relative z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-lg font-display font-semibold text-foreground">Safety & Emergency</h1>
      </div>

      <div className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto relative z-10">
        {/* Disclaimer */}
        <div className="glass-card rounded-3xl p-6 border border-amber/15">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1.5">Important Notice</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anchor AI is a support tool, not a replacement for professional mental health care. 
                If you are in immediate danger, please contact emergency services or a crisis helpline.
              </p>
            </div>
          </div>
        </div>

        {/* Crisis Numbers */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Crisis Helplines</h3>
          <div className="space-y-2">
            {crisisNumbers.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-4 flex items-center gap-3"
              >
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{line.name}</div>
                  <div className="text-xs text-muted-foreground">{line.country}</div>
                </div>
                {line.url ? (
                  <a
                    href={line.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-premium text-xs font-semibold text-primary-foreground"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-sm text-primary font-semibold shrink-0">{line.number}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Privacy recap */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Your Data</h3>
          <div className="glass-card rounded-3xl p-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Face video processed on-device only</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> No raw biometric data leaves your phone</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Stress scores stored locally with optional encrypted sync</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Delete all data anytime from Settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
