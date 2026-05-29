/** Energy-based Voice Activity Detector — AudioWorkletNode. */

export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSegment: (audio: Float32Array, sampleRate: number) => void;
}

export class AudioVAD {
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;

  async start(callbacks: VADCallbacks): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();

    // Static file in public/ — no Blob-URL, no CSP issues
    await this.ctx.audioWorklet.addModule("/vad-processor.js");

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
    this.ctx = null;
    this.node = null;
    this.source = null;
    this.stream = null;
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
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
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
