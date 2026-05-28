## Add MediaPipe FaceMesh for deterministic biometric extraction

Augment VibeScan with on-device facial landmark detection. Combine deterministic biometric measurements with the existing Gemini AI vision analysis for more accurate, robust wellness scoring.

### What changes

**1. Add MediaPipe FaceMesh (client-side, on-device)**
- Install `@mediapipe/tasks-vision` (uses WebAssembly, runs locally — no data leaves the device for landmark detection).
- Load the FaceLandmarker model once on VibeScan mount.
- During scan, extract 468 facial landmarks + blendshape coefficients from the same captured frame.

**2. Compute deterministic biometric features**
From landmarks/blendshapes, compute:
- **Eye Aspect Ratio (EAR)** — eye openness (wide eyes → fear/alert)
- **Brow tension** — inner-brow raise + brow-down blendshapes
- **Jaw clench proxy** — jaw-open inverse + masseter region distance
- **Mouth tension** — lip-press, mouth-frown blendshapes
- **Head pose stability** — roll/pitch/yaw deviation (slumped = low-energy)
- **Blink rate** — sampled across the 30s scan

**3. Fusion with Gemini AI**
- Send both the image AND the computed biometric vector to the `analyze-face` edge function.
- Update the edge function's prompt to give Gemini the deterministic measurements as context, so it acts as a reasoning layer over hard signals rather than guessing from pixels alone.
- Final `StressClassification` blends: 60% deterministic biometrics + 40% Gemini interpretation (weights tunable).

**4. UI feedback**
- During scan: show a subtle landmark overlay (dots on the face) so the user sees real-time tracking — reinforces "this is actually measuring you."
- Results screen: add a small "Biometric signals" expandable section showing the underlying measurements (eye openness, jaw tension, etc.) for transparency.

### Files touched

- `src/pages/VibeScan.tsx` — load FaceLandmarker, run detection, draw overlay, send biometrics to edge function
- `src/lib/face-biometrics.ts` *(new)* — landmark math (EAR, brow tension, head pose, etc.)
- `supabase/functions/analyze-face/index.ts` — accept biometric vector, update Gemini prompt, fusion logic
- `src/lib/stress-engine.ts` — extend `StressClassification` with optional `biometrics` field

### Privacy note
MediaPipe runs entirely in the browser via WebAssembly. Landmarks are computed locally; only the already-existing image + numeric biometric summary are sent to the edge function. No new data category leaves the device.

### Tradeoffs
- Adds ~2MB WASM download on first VibeScan load (cached after).
- Slightly higher CPU usage during the 30s scan on low-end phones — acceptable, FaceMesh is optimized for mobile.