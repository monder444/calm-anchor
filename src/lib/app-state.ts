import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MentalState, StressClassification } from './stress-engine';

interface AppState {
  isOnboarded: boolean;
  primaryConcern: MentalState | null;
  shieldMode: 'brave' | 'safety';
  currentState: StressClassification | null;
  wearableConnected: boolean;
  vibeScanCalibrated: boolean;
  safetyPlanConfigured: boolean;
  ghostMode: boolean;
  notificationStyle: 'haptic' | 'visual' | 'both';
  sensitivity: number; // 1-5
  quietHoursStart: string;
  quietHoursEnd: string;
  emergencyContacts: Array<{ name: string; phone: string }>;
  completedWins: number;
  plantGrowth: number; // 0-100

  setOnboarded: (v: boolean) => void;
  setPrimaryConcern: (c: MentalState) => void;
  setShieldMode: (m: 'brave' | 'safety') => void;
  setCurrentState: (s: StressClassification | null) => void;
  setWearableConnected: (v: boolean) => void;
  setVibeScanCalibrated: (v: boolean) => void;
  setSafetyPlanConfigured: (v: boolean) => void;
  setGhostMode: (v: boolean) => void;
  setNotificationStyle: (s: 'haptic' | 'visual' | 'both') => void;
  setSensitivity: (n: number) => void;
  completeWin: () => void;
  resetOnboarding: () => void;
}

// Simple zustand-like store without external dependency
let listeners: Array<() => void> = [];
let state: AppState;

function loadState(): Partial<AppState> {
  try {
    const stored = localStorage.getItem('anchor-ai-state');
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveState(s: Partial<AppState>) {
  try {
    localStorage.setItem('anchor-ai-state', JSON.stringify(s));
  } catch {}
}

const defaults = {
  isOnboarded: false,
  primaryConcern: null as MentalState | null,
  shieldMode: 'brave' as const,
  currentState: null as StressClassification | null,
  wearableConnected: false,
  vibeScanCalibrated: false,
  safetyPlanConfigured: false,
  ghostMode: false,
  notificationStyle: 'both' as const,
  sensitivity: 3,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  emergencyContacts: [],
  completedWins: 0,
  plantGrowth: 0,
};

const stored = loadState();
const initial = { ...defaults, ...stored };

export function useAppState(): AppState {
  const [, setTick] = (await import('react')).then ? [0, () => {}] : [0, () => {}];
  // We'll use React state for re-renders
  return state;
}

// Actually let's just use React context
export { defaults as initialAppState };
