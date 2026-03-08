import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { MentalState, StressClassification } from './stress-engine';

export type ThemeMode = 'dark' | 'light';

export interface AppState {
  isOnboarded: boolean;
  primaryConcern: MentalState | null;
  shieldMode: 'brave' | 'safety';
  currentState: StressClassification | null;
  wearableConnected: boolean;
  vibeScanCalibrated: boolean;
  safetyPlanConfigured: boolean;
  ghostMode: boolean;
  notificationStyle: 'haptic' | 'visual' | 'both';
  sensitivity: number;
  completedWins: number;
  plantGrowth: number;
  voiceMuted: boolean;
  theme: ThemeMode;
}

interface AppActions {
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
  setVoiceMuted: (v: boolean) => void;
  setTheme: (t: ThemeMode) => void;
  resetOnboarding: () => void;
}

const defaults: AppState = {
  isOnboarded: false,
  primaryConcern: null,
  shieldMode: 'brave',
  currentState: null,
  wearableConnected: false,
  vibeScanCalibrated: false,
  safetyPlanConfigured: false,
  ghostMode: false,
  notificationStyle: 'both',
  sensitivity: 3,
  completedWins: 0,
  plantGrowth: 0,
  voiceMuted: false,
  theme: 'dark',
};

const AppStateContext = createContext<(AppState & AppActions) | null>(null);

function loadState(): Partial<AppState> {
  try {
    const stored = localStorage.getItem('anchor-ai-state');
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({ ...defaults, ...loadState() }));

  useEffect(() => {
    const { currentState, ...persist } = state;
    localStorage.setItem('anchor-ai-state', JSON.stringify(persist));
  }, [state]);

  const update = useCallback((partial: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const actions: AppActions = {
    setOnboarded: (v) => update({ isOnboarded: v }),
    setPrimaryConcern: (c) => update({ primaryConcern: c }),
    setShieldMode: (m) => update({ shieldMode: m }),
    setCurrentState: (s) => update({ currentState: s }),
    setWearableConnected: (v) => update({ wearableConnected: v }),
    setVibeScanCalibrated: (v) => update({ vibeScanCalibrated: v }),
    setSafetyPlanConfigured: (v) => update({ safetyPlanConfigured: v }),
    setGhostMode: (v) => update({ ghostMode: v }),
    setNotificationStyle: (s) => update({ notificationStyle: s }),
    setSensitivity: (n) => update({ sensitivity: n }),
    completeWin: () => update({ completedWins: state.completedWins + 1, plantGrowth: Math.min(100, state.plantGrowth + 8) }),
    setVoiceMuted: (v) => update({ voiceMuted: v }),
    setTheme: (t) => update({ theme: t }),
    resetOnboarding: () => setState({ ...defaults }),
  };

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [state.theme]);

  return (
    <AppStateContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
