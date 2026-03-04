export type MentalState = 'panic' | 'anxiety' | 'depression' | 'baseline';

export interface BiometricSnapshot {
  heartRate: number;
  hrv: number;
  respiratoryRate: number;
  movement: number; // 0-100
  emotionalMarkers: {
    fear: number;    // 0-1
    tension: number; // 0-1
    flatAffect: number; // 0-1
    relaxed: number; // 0-1
  };
}

export interface UserBaseline {
  avgHeartRate: number;
  avgHrv: number;
  avgMovement: number;
}

const DEFAULT_BASELINE: UserBaseline = {
  avgHeartRate: 72,
  avgHrv: 55,
  avgMovement: 40,
};

export interface StressClassification {
  state: MentalState;
  confidence: number;
  stressIndex: number; // 0-100
  label: string;
  description: string;
  color: 'teal' | 'violet' | 'amber' | 'primary';
}

export function classifyState(
  snapshot: BiometricSnapshot,
  baseline: UserBaseline = DEFAULT_BASELINE,
  context?: { isExercising?: boolean; isWorkout?: boolean }
): StressClassification {
  if (context?.isExercising || context?.isWorkout) {
    return {
      state: 'baseline',
      confidence: 0.7,
      stressIndex: 15,
      label: 'Active & Well',
      description: 'Physical activity detected. Your body is working as expected.',
      color: 'teal',
    };
  }

  const hrElevation = (snapshot.heartRate - baseline.avgHeartRate) / baseline.avgHeartRate;
  const hrvDepression = (baseline.avgHrv - snapshot.hrv) / baseline.avgHrv;
  const { fear, tension, flatAffect, relaxed } = snapshot.emotionalMarkers;

  // Panic
  if (snapshot.heartRate >= 120 && snapshot.hrv < 20 && fear > 0.5) {
    return {
      state: 'panic',
      confidence: Math.min(0.95, 0.5 + fear * 0.3 + hrvDepression * 0.2),
      stressIndex: Math.min(100, 70 + fear * 30),
      label: 'High Alert',
      description: 'Your system is in high alert. I\'m here to help you through this.',
      color: 'amber',
    };
  }

  // Anxiety
  if (hrElevation > 0.2 && snapshot.hrv < 40 && tension > 0.3) {
    return {
      state: 'anxiety',
      confidence: Math.min(0.9, 0.4 + tension * 0.3 + hrElevation * 0.2),
      stressIndex: Math.min(70, 40 + tension * 30),
      label: 'Elevated',
      description: 'I\'m noticing some tension. Let\'s take a moment together.',
      color: 'violet',
    };
  }

  // Depression
  if (snapshot.heartRate < baseline.avgHeartRate * 0.9 && snapshot.movement < 20 && flatAffect > 0.4) {
    return {
      state: 'depression',
      confidence: Math.min(0.85, 0.3 + flatAffect * 0.35 + (1 - snapshot.movement / 100) * 0.2),
      stressIndex: Math.min(50, 20 + flatAffect * 30),
      label: 'Low Energy',
      description: 'Your energy levels appear low today. Small steps count.',
      color: 'violet',
    };
  }

  return {
    state: 'baseline',
    confidence: Math.min(0.95, 0.5 + relaxed * 0.45),
    stressIndex: Math.max(0, 20 - relaxed * 20),
    label: 'Balanced',
    description: 'You\'re in a good place right now. Keep it up.',
    color: 'teal',
  };
}

export function generateMockSnapshot(state?: MentalState): BiometricSnapshot {
  switch (state) {
    case 'panic':
      return {
        heartRate: 125 + Math.random() * 15,
        hrv: 12 + Math.random() * 8,
        respiratoryRate: 22 + Math.random() * 6,
        movement: 10 + Math.random() * 20,
        emotionalMarkers: { fear: 0.7 + Math.random() * 0.3, tension: 0.8, flatAffect: 0, relaxed: 0.05 },
      };
    case 'anxiety':
      return {
        heartRate: 95 + Math.random() * 15,
        hrv: 30 + Math.random() * 10,
        respiratoryRate: 18 + Math.random() * 4,
        movement: 30 + Math.random() * 20,
        emotionalMarkers: { fear: 0.2, tension: 0.5 + Math.random() * 0.3, flatAffect: 0.1, relaxed: 0.15 },
      };
    case 'depression':
      return {
        heartRate: 58 + Math.random() * 8,
        hrv: 60 + Math.random() * 15,
        respiratoryRate: 12 + Math.random() * 3,
        movement: 5 + Math.random() * 10,
        emotionalMarkers: { fear: 0.05, tension: 0.1, flatAffect: 0.6 + Math.random() * 0.3, relaxed: 0.1 },
      };
    default:
      return {
        heartRate: 68 + Math.random() * 10,
        hrv: 50 + Math.random() * 20,
        respiratoryRate: 14 + Math.random() * 3,
        movement: 35 + Math.random() * 30,
        emotionalMarkers: { fear: 0.05, tension: 0.1, flatAffect: 0.05, relaxed: 0.7 + Math.random() * 0.3 },
      };
  }
}
