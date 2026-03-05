

## Plan: Add Browser Speech Synthesis to Panic Shield

### What we'll build

Add calm, slow text-to-speech using the Web Speech API to both **Brave Mode** and **Safety Mode** in the Shield. Each step's text will be spoken aloud automatically as it appears on screen.

### Technical approach

**Create a `useSpeech` hook** (`src/hooks/use-speech.ts`) that wraps `window.speechSynthesis`:
- `speak(text)` function that cancels any current speech, then speaks the new text
- Configure for a calm voice: slow rate (~0.85), low pitch (~0.9), moderate volume
- Prefer a female English voice when available (e.g., "Samantha" on Safari/iOS, "Google UK English Female" on Chrome)
- `stop()` function to cancel speech on unmount or exit
- Cleanup on component unmount to prevent orphaned speech

**Integrate into Shield.tsx**:
- **Brave Mode**: Call `speak(current.text)` whenever `stepIndex` changes. Cancel speech on exit.
- **Safety Mode**: Call `speak(current.text)` whenever `promptIndex` changes. Cancel speech on exit.
- Add a mute/unmute toggle button so users can silence the voice if they prefer text-only.

**Add mute state to app-state**:
- Add a `voiceMuted` boolean to `AppState` so the preference persists across sessions.

### Files to create/modify

| File | Change |
|------|--------|
| `src/hooks/use-speech.ts` | New hook wrapping Web Speech API |
| `src/pages/Shield.tsx` | Integrate `useSpeech` in both modes, add mute toggle |
| `src/lib/app-state.tsx` | Add `voiceMuted` state + `setVoiceMuted` action |

### Voice configuration details

- **Rate**: 0.85 (slower than normal for calming effect)
- **Pitch**: 0.9 (slightly lower, less jarring)
- **Voice selection priority**: Picks the first available English voice, preferring ones with "female", "samantha", or "google uk" in the name for a softer tone
- Falls back gracefully if speech synthesis is unavailable (text still displays normally)

