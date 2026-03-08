import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, CheckCircle, Loader2, Watch, X, ChevronRight } from 'lucide-react';
import {
  getAvailableDevices,
  connectWearable,
  disconnectWearable,
  isWearableConnected,
  getConnectedProvider,
  type WearableDevice,
  type WearableProvider,
} from '@/lib/wearable-service';

interface WearableSetupProps {
  /** Called when user connects or skips */
  onComplete: (connected: boolean) => void;
  /** Show skip button */
  showSkip?: boolean;
  /** Compact mode for settings page */
  compact?: boolean;
}

export default function WearableSetup({ onComplete, showSkip = true, compact = false }: WearableSetupProps) {
  const [devices] = useState(getAvailableDevices);
  const [connecting, setConnecting] = useState<WearableProvider | null>(null);
  const [connected, setConnected] = useState<WearableProvider | null>(getConnectedProvider);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async (device: WearableDevice) => {
    setError(null);
    setConnecting(device.provider);
    try {
      const success = await connectWearable(device.provider);
      if (success) {
        setConnected(device.provider);
        setTimeout(() => onComplete(true), 800);
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setConnecting(null);
    }
  }, [onComplete]);

  const handleDisconnect = useCallback(async () => {
    await disconnectWearable();
    setConnected(null);
  }, []);

  if (compact) {
    return (
      <CompactView
        devices={devices}
        connected={connected}
        connecting={connecting}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-8"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {connected ? (
          <CheckCircle className="w-12 h-12 text-primary" />
        ) : (
          <Heart className="w-12 h-12 text-primary" />
        )}
      </motion.div>

      <h1 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight">
        {connected ? 'Connected!' : 'Connect Your Pulse'}
      </h1>
      <p className="text-muted-foreground mb-2 max-w-xs leading-relaxed">
        {connected
          ? `Your ${devices.find(d => d.provider === connected)?.name} is linked. Biometric data will stream in the background.`
          : 'Connect a wearable to enable continuous heart rate and HRV-based stress detection.'}
      </p>

      {!connected && (
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          Select your device below. Data stays on-device and is never shared.
        </p>
      )}

      <AnimatePresence mode="wait">
        {connected ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs"
          >
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3 mb-6">
              <span className="text-2xl">{devices.find(d => d.provider === connected)?.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-foreground text-sm">
                  {devices.find(d => d.provider === connected)?.name}
                </div>
                <div className="text-xs text-primary font-medium">Connected • Streaming</div>
              </div>
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="devices"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs space-y-3 mb-8"
          >
            {devices.map((device) => (
              <motion.button
                key={device.id}
                whileTap={{ scale: 0.97 }}
                disabled={connecting !== null}
                onClick={() => handleConnect(device)}
                className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 text-left disabled:opacity-50"
              >
                <span className="text-2xl">{device.icon}</span>
                <span className="flex-1 font-semibold text-foreground text-sm">{device.name}</span>
                {connecting === device.provider ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.button>
            ))}
            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showSkip && !connected && (
        <button
          onClick={() => onComplete(false)}
          className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}

/** Compact version for Settings page */
function CompactView({
  devices,
  connected,
  connecting,
  onConnect,
  onDisconnect,
}: {
  devices: WearableDevice[];
  connected: WearableProvider | null;
  connecting: WearableProvider | null;
  onConnect: (d: WearableDevice) => void;
  onDisconnect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const connectedDevice = devices.find(d => d.provider === connected);

  if (connected && connectedDevice && !expanded) {
    return (
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Watch className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">{connectedDevice.name}</div>
            <div className="text-xs text-primary font-medium">Connected • Streaming</div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(true)}
            className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors"
          >
            Change
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Watch className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {connected ? 'Change Device' : 'Connect Wearable'}
          </span>
        </div>
        {expanded && (
          <button onClick={() => setExpanded(false)}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {devices.map((device) => (
        <motion.button
          key={device.id}
          whileTap={{ scale: 0.97 }}
          disabled={connecting !== null}
          onClick={() => onConnect(device)}
          className={`w-full rounded-2xl p-3 flex items-center gap-3 text-left transition-all disabled:opacity-50 ${
            connected === device.provider
              ? 'bg-primary/10 border border-primary/30'
              : 'bg-muted/30'
          }`}
        >
          <span className="text-xl">{device.icon}</span>
          <span className="flex-1 text-sm font-medium text-foreground">{device.name}</span>
          {connecting === device.provider ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : connected === device.provider ? (
            <CheckCircle className="w-4 h-4 text-primary" />
          ) : null}
        </motion.button>
      ))}
      {connected && (
        <button
          onClick={onDisconnect}
          className="text-xs text-destructive font-medium hover:text-destructive/80 transition-colors"
        >
          Disconnect device
        </button>
      )}
    </div>
  );
}
