/**
 * Deterministic facial biometric feature extraction from MediaPipe FaceLandmarker.
 * All math runs on-device. Returns numeric features in 0-1 range when applicable.
 */
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';

export interface FaceBiometrics {
  eyeOpenness: number;   // 0=closed, 1=very wide (alert/fear)
  browTension: number;   // 0-1 furrowed/raised brow intensity
  jawTension: number;    // 0-1 clenched jaw proxy
  mouthTension: number;  // 0-1 pressed/frowning mouth
  headTilt: number;      // 0-1 deviation from upright
  blinkRate: number;     // blinks per minute (sampled over scan)
  samples: number;       // number of frames sampled
}

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      );
      return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

// Eye Aspect Ratio (EAR) — Soukupová & Čech (2016) adapted for MediaPipe 468-point mesh.
// Eye landmarks (left eye from subject's perspective in the mesh):
//   left:  33 (outer), 133 (inner), 159 (top), 145 (bottom), 158, 153
//   right: 362, 263, 386, 374, 385, 380
function ear(lms: NormalizedLandmark[], idx: number[]): number {
  const p = idx.map(i => lms[i]);
  const dist = (a: NormalizedLandmark, b: NormalizedLandmark) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  // vertical / horizontal
  return (dist(p[2], p[3]) + dist(p[4], p[5])) / (2 * dist(p[0], p[1]));
}

function blendshape(result: FaceLandmarkerResult, name: string): number {
  const cats = result.faceBlendshapes?.[0]?.categories;
  if (!cats) return 0;
  const c = cats.find(c => c.categoryName === name);
  return c?.score ?? 0;
}

export interface SampleAggregate {
  earSum: number;
  blinkCount: number;
  lastEarOpen: boolean;
  browSum: number;
  jawSum: number;
  mouthSum: number;
  tiltSum: number;
  count: number;
  startMs: number;
}

export function newAggregate(): SampleAggregate {
  return {
    earSum: 0,
    blinkCount: 0,
    lastEarOpen: true,
    browSum: 0,
    jawSum: 0,
    mouthSum: 0,
    tiltSum: 0,
    count: 0,
    startMs: performance.now(),
  };
}

export function ingestSample(agg: SampleAggregate, result: FaceLandmarkerResult): boolean {
  const lms = result.faceLandmarks?.[0];
  if (!lms) return false;

  const leftEar = ear(lms, [33, 133, 159, 145, 158, 153]);
  const rightEar = ear(lms, [362, 263, 386, 374, 385, 380]);
  const avgEar = (leftEar + rightEar) / 2;

  // Blink detection: EAR drops below 0.18 then recovers
  const isOpen = avgEar > 0.22;
  if (agg.lastEarOpen && !isOpen) agg.blinkCount++;
  agg.lastEarOpen = isOpen;

  agg.earSum += avgEar;

  // Brow tension: combine inner-brow raise + brow-down
  const browInner = blendshape(result, 'browInnerUp');
  const browDownL = blendshape(result, 'browDownLeft');
  const browDownR = blendshape(result, 'browDownRight');
  agg.browSum += Math.min(1, browInner * 0.5 + (browDownL + browDownR) * 0.5);

  // Jaw tension: low jawOpen + presence of mouthPress (clenched)
  const jawOpen = blendshape(result, 'jawOpen');
  const mouthPressL = blendshape(result, 'mouthPressLeft');
  const mouthPressR = blendshape(result, 'mouthPressRight');
  agg.jawSum += Math.min(1, (1 - jawOpen) * 0.3 + (mouthPressL + mouthPressR) * 0.5);

  // Mouth tension: frown + press
  const frownL = blendshape(result, 'mouthFrownLeft');
  const frownR = blendshape(result, 'mouthFrownRight');
  agg.mouthSum += Math.min(1, (frownL + frownR) * 0.6 + (mouthPressL + mouthPressR) * 0.4);

  // Head tilt: deviation of line between eyes from horizontal
  const leftEye = lms[33];
  const rightEye = lms[263];
  const tiltRad = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  agg.tiltSum += Math.min(1, Math.abs(tiltRad) / (Math.PI / 6)); // normalize to 30deg max

  agg.count++;
  return true;
}

export function finalize(agg: SampleAggregate): FaceBiometrics {
  if (agg.count === 0) {
    return { eyeOpenness: 0.5, browTension: 0, jawTension: 0, mouthTension: 0, headTilt: 0, blinkRate: 0, samples: 0 };
  }
  const elapsedMin = (performance.now() - agg.startMs) / 60000;
  const avgEar = agg.earSum / agg.count;
  // Map EAR (~0.15 closed → ~0.35 very wide) to 0-1
  const eyeOpenness = Math.max(0, Math.min(1, (avgEar - 0.15) / 0.2));
  return {
    eyeOpenness,
    browTension: agg.browSum / agg.count,
    jawTension: agg.jawSum / agg.count,
    mouthTension: agg.mouthSum / agg.count,
    headTilt: agg.tiltSum / agg.count,
    blinkRate: elapsedMin > 0 ? agg.blinkCount / elapsedMin : 0,
    samples: agg.count,
  };
}

/**
 * Map biometrics → deterministic emotional marker scores (0-1).
 * Mirrors the structure Gemini returns so we can fuse them.
 */
export function biometricsToMarkers(b: FaceBiometrics): {
  fear: number; tension: number; flatAffect: number; relaxed: number;
} {
  // Fear: wide eyes + high blink rate (>25/min)
  const blinkFactor = Math.min(1, Math.max(0, (b.blinkRate - 15) / 25));
  const fear = Math.min(1, b.eyeOpenness * 0.7 + blinkFactor * 0.3);

  // Tension: brow + jaw + mouth
  const tension = Math.min(1, b.browTension * 0.4 + b.jawTension * 0.3 + b.mouthTension * 0.3);

  // Flat affect: low brow, low mouth movement, head tilt (slumped)
  const flatAffect = Math.min(1,
    (1 - b.browTension) * 0.3 +
    (1 - b.mouthTension) * 0.3 +
    b.headTilt * 0.2 +
    Math.max(0, (15 - b.blinkRate) / 15) * 0.2
  );

  // Relaxed: inverse of others
  const relaxed = Math.max(0, 1 - (fear * 0.4 + tension * 0.4 + flatAffect * 0.2));

  return { fear, tension, flatAffect, relaxed };
}
