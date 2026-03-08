// Simulated wearable data service
// In a real native app, this would connect to Apple HealthKit / Google Fit via Capacitor plugins.
// For now it generates realistic mock biometric streams.

import type { BiometricSnapshot } from './stress-engine';

export type WearableProvider = 'apple_health' | 'google_fit' | 'oura' | 'fitbit' | 'simulated';

export interface WearableDevice {
  id: string;
  provider: WearableProvider;
  name: string;
  icon: string;
  connected: boolean;
  lastSync: Date | null;
}

const PROVIDERS: Omit<WearableDevice, 'connected' | 'lastSync'>[] = [
  { id: 'apple_health', provider: 'apple_health', name: 'Apple Health', icon: '🍎' },
  { id: 'google_fit', provider: 'google_fit', name: 'Google Fit', icon: '💚' },
  { id: 'oura', provider: 'oura', name: 'Oura Ring', icon: '💍' },
  { id: 'fitbit', provider: 'fitbit', name: 'Fitbit', icon: '⌚' },
];

let connectedProvider: WearableProvider | null = null;
let streamInterval: ReturnType<typeof setInterval> | null = null;
let listeners: Array<(snapshot: BiometricSnapshot) => void> = [];

function loadConnection(): WearableProvider | null {
  try {
    return localStorage.getItem('anchor-wearable-provider') as WearableProvider | null;
  } catch { return null; }
}

function saveConnection(provider: WearableProvider | null) {
  if (provider) {
    localStorage.setItem('anchor-wearable-provider', provider);
  } else {
    localStorage.removeItem('anchor-wearable-provider');
  }
}

// Initialize from storage
connectedProvider = loadConnection();

export function getAvailableDevices(): WearableDevice[] {
  return PROVIDERS.map(p => ({
    ...p,
    connected: connectedProvider === p.provider,
    lastSync: connectedProvider === p.provider ? new Date() : null,
  }));
}

export function getConnectedProvider(): WearableProvider | null {
  return connectedProvider;
}

export function isWearableConnected(): boolean {
  return connectedProvider !== null;
}

export async function connectWearable(provider: WearableProvider): Promise<boolean> {
  // Simulate connection delay
  await new Promise(r => setTimeout(r, 1500));
  connectedProvider = provider;
  saveConnection(provider);
  return true;
}

export async function disconnectWearable(): Promise<void> {
  stopStream();
  connectedProvider = null;
  saveConnection(null);
}

function generateRealtimeSnapshot(): BiometricSnapshot {
  const baseHR = 68 + Math.random() * 12;
  const now = Date.now();
  // Add subtle circadian rhythm variation
  const hour = new Date().getHours();
  const circadianOffset = Math.sin((hour - 6) * Math.PI / 12) * 5;

  return {
    heartRate: Math.round(baseHR + circadianOffset + (Math.random() - 0.5) * 6),
    hrv: Math.round(45 + Math.random() * 25 + (Math.random() - 0.5) * 8),
    respiratoryRate: Math.round((14 + Math.random() * 4) * 10) / 10,
    movement: Math.round(Math.random() * 30),
    emotionalMarkers: {
      fear: Math.round(Math.random() * 15) / 100,
      tension: Math.round(Math.random() * 25) / 100,
      flatAffect: Math.round(Math.random() * 10) / 100,
      relaxed: Math.round((60 + Math.random() * 35)) / 100,
    },
  };
}

export function startStream(onData: (snapshot: BiometricSnapshot) => void, intervalMs = 5000) {
  listeners.push(onData);
  if (!streamInterval) {
    streamInterval = setInterval(() => {
      const snapshot = generateRealtimeSnapshot();
      listeners.forEach(fn => fn(snapshot));
    }, intervalMs);
  }
}

export function stopStream() {
  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
  }
  listeners = [];
}

export function getLatestSnapshot(): BiometricSnapshot {
  return generateRealtimeSnapshot();
}
