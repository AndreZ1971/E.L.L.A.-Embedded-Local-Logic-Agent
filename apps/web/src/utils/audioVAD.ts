/** Energy-based Voice Activity Detector — AudioWorkletNode. */

// Worklet-Code als Blob — umgeht file://-Einschränkungen von Chromium/Electron
// und braucht keinen externen HTTP-Fetch für das Modul.
const VAD_PROCESSOR_CODE = `
class VADProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = [];
    this._speaking = false;
    this._silence = 0;
    this._speechFrames = 0;
    this._noiseFloor = 0.012;
    this._noiseFrameCount = 0;
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;
    let rms = 0;
    for (let i = 0; i < ch.length; i++) rms += ch[i] * ch[i];
    rms = Math.sqrt(rms / ch.length);
    const SILENCE_FRAMES = 80;
    const MIN_SPEECH_FRAMES = 8;
    // Adaptive threshold: speech must be 3.5x above measured noise floor.
    // Minimum 0.015 so quiet environments don't become hair-trigger.
    const threshold = Math.max(0.015, this._noiseFloor * 3.5);
    if (rms > threshold) {
      if (!this._speaking) {
        this._speaking = true;
        this._silence = 0;
        this._speechFrames = 0;
        this.port.postMessage({ type: 'speechStart' });
      }
      this._silence = 0;
      this._speechFrames++;
      this._buf.push(ch.slice());
    } else if (this._speaking) {
      this._silence++;
      this._buf.push(ch.slice());
      if (this._silence >= SILENCE_FRAMES) {
        if (this._speechFrames >= MIN_SPEECH_FRAMES) {
          const total = this._buf.reduce((s, b) => s + b.length, 0);
          const out = new Float32Array(total);
          let off = 0;
          for (const b of this._buf) { out.set(b, off); off += b.length; }
          this.port.postMessage({ type: 'segment', audio: out }, [out.buffer]);
        }
        this._buf = [];
        this._speaking = false;
        this._silence = 0;
        this._speechFrames = 0;
      }
    } else {
      // Not speaking — update noise floor with exponential moving average.
      // Skip first 20 frames to avoid init spike.
      this._noiseFrameCount++;
      if (this._noiseFrameCount > 20) {
        this._noiseFloor = this._noiseFloor * 0.98 + rms * 0.02;
      }
    }
    return true;
  }
}
registerProcessor('vad-processor', VADProcessor);
`;

export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSegment: (audio: Float32Array, sampleRate: number) => void;
}

export class AudioVAD {
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private blobUrl: string | null = null;

  async start(callbacks: VADCallbacks): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    });
    this.ctx = new AudioContext();

    // Auto-resume wenn Electron/Browser den AudioContext suspendiert (Stille-Timeout)
    this.ctx.onstatechange = () => {
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    };

    // Blob-URL: kein HTTP-Fetch nötig — funktioniert in http:// und Electron file://
    const blob = new Blob([VAD_PROCESSOR_CODE], {
      type: "application/javascript",
    });
    this.blobUrl = URL.createObjectURL(blob);
    await this.ctx.audioWorklet.addModule(this.blobUrl);

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "vad-processor");

    this.node.port.onmessage = (
      e: MessageEvent<{ type: string; audio?: Float32Array }>,
    ) => {
      if (e.data.type === "speechStart") {
        callbacks.onSpeechStart?.();
      } else if (e.data.type === "segment" && e.data.audio) {
        callbacks.onSegment(e.data.audio, this.ctx!.sampleRate);
      }
    };

    // Connect to destination (silent output) to keep audio graph active.
    this.source.connect(this.node);
    this.node.connect(this.ctx.destination);
  }

  stop(): void {
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => {});
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.ctx = null;
    this.node = null;
    this.source = null;
    this.stream = null;
    this.blobUrl = null;
  }
}

/** Encode Float32Array PCM samples to a WAV Blob. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buf);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);
  const int16 = new Int16Array(buf, 44);
  for (let i = 0; i < samples.length; i++) {
    int16[i] = Math.max(
      -32768,
      Math.min(32767, Math.round(samples[i] * 32768)),
    );
  }
  return new Blob([buf], { type: "audio/wav" });
}
