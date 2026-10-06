// MediaPipe Hand Landmarker — loaded from CDN on demand (no npm dependency)

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface HandLandmarkerResult {
  landmarks: Landmark[][];
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

export interface GestureFrame {
  gesture: GestureType;
  cursor: CursorPos;
  pinchDistance: number;
  landmarks: Landmark[] | null;
}

type Listener = (frame: GestureFrame) => void;

const PINCH_THRESHOLD = 0.06;
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

  private prevWristX = 0;
  private prevTime = 0;
  private wasPinch = false;
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
        numHands: 1,
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
    this.wasPinch = false;
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

    if (res.landmarks?.length > 0) {
      const lm = res.landmarks[0];
      const g = this.classify(lm, now);

      const rawX = 1 - lm[8].x;
      const rawY = lm[8].y;
      this.smooth.x += (rawX - this.smooth.x) * SMOOTH;
      this.smooth.y += (rawY - this.smooth.y) * SMOOTH;

      const frame: GestureFrame = {
        gesture: g.type,
        cursor: {
          x: this.smooth.x,
          y: this.smooth.y,
          screenX: this.smooth.x * window.innerWidth,
          screenY: this.smooth.y * window.innerHeight,
        },
        pinchDistance: g.pinchDist,
        landmarks: lm,
      };

      for (const cb of this.listeners) cb(frame);
    }

    this.raf = requestAnimationFrame(this.detect);
  };

  private classify(lm: Landmark[], now: number) {
    const idxExt = lm[8].y < lm[6].y;
    const midExt = lm[12].y < lm[10].y;
    const ringExt = lm[16].y < lm[14].y;
    const pinkyExt = lm[20].y < lm[18].y;

    const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
    const isPinch = pinchDist < PINCH_THRESHOLD;

    const isPoint = idxExt && !midExt && !ringExt && !pinkyExt && !isPinch;
    const isPalm = idxExt && midExt && ringExt && pinkyExt && !isPinch;
    const isFist = !idxExt && !midExt && !ringExt && !pinkyExt;

    const wX = lm[0].x;
    const dt = (now - this.prevTime) / 1000;
    const vel = dt > 0 && this.prevTime > 0 ? (wX - this.prevWristX) / dt : 0;
    this.prevWristX = wX;
    this.prevTime = now;

    const swipeR = vel > SWIPE_VELOCITY;
    const swipeL = vel < -SWIPE_VELOCITY;

    const isDrag = isPinch && this.wasPinch;
    this.wasPinch = isPinch;

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
