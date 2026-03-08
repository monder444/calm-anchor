import { useCallback, useEffect, useRef } from 'react';

type VoiceGender = 'female' | 'male';

interface VoicePreference {
  gender: VoiceGender;
  // Unique voice preferences per therapist so each sounds distinct
  preferred: string[];
  pitch: number;
}

const therapistVoiceMap: Record<string, VoicePreference> = {
  aria: {
    gender: 'female',
    preferred: [
      'samantha',              // macOS/iOS – warm & natural
      'google uk english female',
      'microsoft zira',        // Windows – clear & calm
    ],
    pitch: 1.05,
  },
  maya: {
    gender: 'female',
    preferred: [
      'karen',                 // macOS – soft Australian
      'moira',                 // macOS – gentle Irish
      'google us english female',
      'microsoft hazel',
    ],
    pitch: 1.0,
  },
  luna: {
    gender: 'female',
    preferred: [
      'tessa',                 // macOS – South African, calm
      'fiona',                 // macOS – Scottish, soothing
      'victoria',              // macOS
      'microsoft susan',
    ],
    pitch: 1.1,
  },
  ethan: {
    gender: 'male',
    preferred: [
      'daniel',                // macOS/iOS – British male
      'google uk english male',
      'microsoft david',       // Windows – clear male
      'james',
    ],
    pitch: 0.95,
  },
  noah: {
    gender: 'male',
    preferred: [
      'alex',                  // macOS – American male
      'tom',                   // macOS
      'google us english male',
      'microsoft mark',        // Windows – male
      'fred',
    ],
    pitch: 0.9,
  },
};

function pickVoiceForTherapist(therapistId: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter(v => v.lang.startsWith('en'));
  const prefs = therapistVoiceMap[therapistId];

  if (prefs) {
    // Try preferred voices first
    for (const pref of prefs.preferred) {
      const match = english.find(v => v.name.toLowerCase().includes(pref));
      if (match) return match;
    }

    // Fallback: pick any voice matching gender
    if (prefs.gender === 'male') {
      const male = english.find(v => {
        const name = v.name.toLowerCase();
        return name.includes('male') && !name.includes('female');
      }) || english.find(v => {
        const name = v.name.toLowerCase();
        return ['daniel', 'david', 'mark', 'james', 'alex', 'tom', 'fred', 'george', 'lee'].some(n => name.includes(n));
      });
      if (male) return male;
    } else {
      const female = english.find(v => v.name.toLowerCase().includes('female'))
        || english.find(v => {
          const name = v.name.toLowerCase();
          return ['samantha', 'karen', 'moira', 'tessa', 'fiona', 'victoria', 'zira', 'hazel', 'susan'].some(n => name.includes(n));
        });
      if (female) return female;
    }
  }

  return english[0] || voices[0] || null;
}

export function useSpeech() {
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    utterRef.current = null;
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void, therapistId?: string) => {
    if (!window.speechSynthesis) return;
    stop();
    const utter = new SpeechSynthesisUtterance(text);
    const prefs = therapistId ? therapistVoiceMap[therapistId] : undefined;
    utter.rate = 0.88;
    utter.pitch = prefs?.pitch ?? 1.05;
    utter.volume = 1.0;
    const voice = pickVoiceForTherapist(therapistId || 'aria');
    if (voice) utter.voice = voice;
    if (onEnd) utter.onend = onEnd;
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [stop]);

  useEffect(() => {
    const handler = () => {};
    window.speechSynthesis?.addEventListener?.('voiceschanged', handler);
    return () => {
      stop();
      window.speechSynthesis?.removeEventListener?.('voiceschanged', handler);
    };
  }, [stop]);

  return { speak, stop };
}
