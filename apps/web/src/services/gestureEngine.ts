// MediaPipe Hand Landmarker — loaded from CDN on demand (no npm dependency)

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface HandLandmarkerResult {
  landmarks: Landmark[][];
  handedness: { categoryName: string }[][];
}

interface HandLandmarkerInstance {
  detectForVideo(video: HTMLVideoElement, ts: number): HandLandmarkerResult;
  close(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _FilesetResolver: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _HandLandmarker: any;

export type GestureType =
  | "none"
  | "pinch"
  | "pinch_drag"
  | "point"
  | "palm"
  | "fist"
  | "swipe_left"
  | "swipe_right";

export interface CursorPos {
  x: number; // 0..1
  y: number; // 0..1
  screenX: number; // px
  screenY: number; // px
}

export interface HandData {
  landmarks: Landmark[];
  gesture: GestureType;
  pinchDistance: number;
  handedness: "Left" | "Right";
}

export interface GestureFrame {
  gesture: GestureType;
  cursor: CursorPos;
  pinchDistance: number;
  landmarks: Landmark[] | null;
  hands: HandData[];
}

type Listener = (frame: GestureFrame) => void;

// Hysteresis: must be closer than ON to start pinching,
// must be farther than OFF to stop — prevents flickering
const PINCH_ON = 0.065;
const PINCH_OFF = 0.095;
const PINCH_HOLD_FRAMES = 3; // frames pinch must hold before engaging
const SWIPE_VELOCITY = 1.2;
const SMOOTH = 0.35;

const MEDIAPIPE_VERSION = "0.10.18";
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;

export class GestureEngine {
  private hl: HandLandmarkerInstance | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private raf = 0;
  private listeners = new Set<Listener>();
  private _running = false;
  private _loading = false;

  private prevWristX: number[] = [0, 0];
  private prevTime = 0;
  private pinchActive: boolean[] = [false, false];
  private pinchFrames: number[] = [0, 0];
  private smooth = { x: 0.5, y: 0.5 };

  get running() {
    return this._running;
  }
  get loading() {
    return this._loading;
  }

  async start(): Promise<void> {
    if (this._running || this._loading) return;
    this._loading = true;

    try {
      if (!_FilesetResolver) {
        const m = await import(
          /* @vite-ignore */
          `${CDN}/vision_bundle.mjs`
        );
        _FilesetResolver = m.FilesetResolver;
        _HandLandmarker = m.HandLandmarker;
      }

      const vision = await _FilesetResolver.forVisionTasks(`${CDN}/wasm`);

      this.hl = (await _HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      })) as HandLandmarkerInstance;

      this.video = document.createElement("video");
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      this.video.srcObject = this.stream;
      await this.video.play();

      this._running = true;
      this._loading = false;
      this.detect();
    } catch (err) {
      this._loading = false;
      throw err;
    }
  }

  stop(): void {
    this._running = false;
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.hl?.close();
    this.hl = null;
    this.pinchActive = [false, false];
    this.pinchFrames = [0, 0];
    this.prevTime = 0;
  }

  on(cb: Listener) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  off(cb: Listener) {
    this.listeners.delete(cb);
  }

  getVideo() {
    return this.video;
  }

  private detect = () => {
    if (!this._running || !this.video || !this.hl) return;

    const now = performance.now();
    const res = this.hl.detectForVideo(this.video, now);

    const handCount = res.landmarks?.length ?? 0;

    if (handCount > 0) {
      const hands: HandData[] = [];

      for (let h = 0; h < handCount; h++) {
        const lm = res.landmarks[h];
        const g = this.classifyHand(lm, now, h);
        const rawHandedness = res.handedness?.[h]?.[0]?.categoryName ?? "Right";
        // MediaPipe reports handedness from the camera's perspective (mirrored)
        const handedness = rawHandedness === "Left" ? "Right" : "Left";
        hands.push({
          landmarks: lm,
          gesture: g.type,
          pinchDistance: g.pinchDist,
          handedness: handedness as "Left" | "Right",
        });
      }

      // Primary hand = first detected → drives cursor
      const primary = hands[0];
      const lm = primary.landmarks;

      const rawX = 1 - lm[8].x;
      const rawY = lm[8].y;
      this.smooth.x += (rawX - this.smooth.x) * SMOOTH;
      this.smooth.y += (rawY - this.smooth.y) * SMOOTH;

      const frame: GestureFrame = {
        gesture: primary.gesture,
        cursor: {
          x: this.smooth.x,
          y: this.smooth.y,
          screenX: this.smooth.x * window.innerWidth,
          screenY: this.smooth.y * window.innerHeight,
        },
        pinchDistance: primary.pinchDistance,
        landmarks: lm,
        hands,
      };

      for (const cb of this.listeners) cb(frame);
    }

    this.raf = requestAnimationFrame(this.detect);
  };

  private classifyHand(lm: Landmark[], now: number, handIdx: number) {
    const idxExt = lm[8].y < lm[6].y;
    const midExt = lm[12].y < lm[10].y;
    const ringExt = lm[16].y < lm[14].y;
    const pinkyExt = lm[20].y < lm[18].y;

    const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);

    // Hysteresis: different thresholds for engage/disengage
    const wasActive = this.pinchActive[handIdx];
    const rawPinch = wasActive
      ? pinchDist < PINCH_OFF // already pinching → need wider distance to release
      : pinchDist < PINCH_ON; // not pinching → need closer distance to engage

    // Frame counter: require stable pinch for PINCH_HOLD_FRAMES before activating
    if (rawPinch) {
      this.pinchFrames[handIdx] = Math.min(
        this.pinchFrames[handIdx] + 1,
        PINCH_HOLD_FRAMES + 1,
      );
    } else {
      this.pinchFrames[handIdx] = 0;
    }

    const isPinch = wasActive
      ? rawPinch // already active → stay active until hysteresis releases
      : this.pinchFrames[handIdx] >= PINCH_HOLD_FRAMES; // not active → need stable frames

    const isDrag = isPinch && wasActive;
    this.pinchActive[handIdx] = isPinch;

    const isPoint = idxExt && !midExt && !ringExt && !pinkyExt && !isPinch;
    const isPalm = idxExt && midExt && ringExt && pinkyExt && !isPinch;
    const isFist = !idxExt && !midExt && !ringExt && !pinkyExt;

    const wX = lm[0].x;
    const dt = (now - this.prevTime) / 1000;
    const vel =
      dt > 0 && this.prevTime > 0 ? (wX - this.prevWristX[handIdx]) / dt : 0;
    this.prevWristX[handIdx] = wX;
    if (handIdx === 0) this.prevTime = now;

    const swipeR = vel > SWIPE_VELOCITY;
    const swipeL = vel < -SWIPE_VELOCITY;

    let type: GestureType = "none";
    if (isDrag) type = "pinch_drag";
    else if (isPinch) type = "pinch";
    else if (swipeL) type = "swipe_left";
    else if (swipeR) type = "swipe_right";
    else if (isPoint) type = "point";
    else if (isPalm) type = "palm";
    else if (isFist) type = "fist";

    return { type, pinchDist };
  }
}

export const gestureEngine = new GestureEngine();
