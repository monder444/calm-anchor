import { useCallback, useEffect, useRef } from 'react';

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter(v => v.lang.startsWith('en'));
  const preferred = ['samantha', 'google uk english female', 'female', 'fiona', 'karen', 'moira'];
  for (const pref of preferred) {
    const match = english.find(v => v.name.toLowerCase().includes(pref));
    if (match) return match;
  }
  return english[0] || voices[0] || null;
}

export function useSpeech() {
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    utterRef.current = null;
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    stop();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = 0.9;
    utter.volume = 1;
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [stop]);

  useEffect(() => {
    // Voices load async in some browsers
    const handler = () => {};
    window.speechSynthesis?.addEventListener?.('voiceschanged', handler);
    return () => {
      stop();
      window.speechSynthesis?.removeEventListener?.('voiceschanged', handler);
    };
  }, [stop]);

  return { speak, stop };
}
