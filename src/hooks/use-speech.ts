import { useCallback, useEffect, useRef } from 'react';

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter(v => v.lang.startsWith('en'));
  // Prioritise warm, gentle voices known across platforms
  const preferred = [
    'samantha',            // macOS / iOS – warm & natural
    'google uk english female',
    'karen',               // macOS – soft Australian
    'moira',               // macOS – gentle Irish
    'tessa',               // macOS – South African, calm
    'fiona',               // macOS – Scottish, soothing
    'microsoft zira',      // Windows – clear & calm
    'female',
  ];
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

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    stop();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;   // slightly faster = more dynamic & enthusiastic
    utter.pitch = 1.1;   // higher pitch = more vivid & expressive
    utter.volume = 1.0;  // full volume for clarity
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    if (onEnd) utter.onend = onEnd;
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
