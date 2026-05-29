/** Simple energy-based Voice Activity Detector using Web Audio API. */

const SPEECH_THRESHOLD = 0.015; // RMS threshold to consider as speech
const SILENCE_FRAMES_TO_END = 18; // ~0.75s silence at 2048/48kHz → segment done

export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSegment: (audio: Float32Array, sampleRate: number) => void;
}

export class AudioVAD {
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private buffer: Float32Array[] = [];
  private isSpeaking = false;
  private silenceCount = 0;

  async start(callbacks: VADCallbacks): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    // ScriptProcessorNode is deprecated but AudioWorklet requires more setup
    this.processor = this.ctx.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0);
      let rms = 0;
      for (let i = 0; i < data.length; i++) rms += data[i] * data[i];
      rms = Math.sqrt(rms / data.length);

      if (rms > SPEECH_THRESHOLD) {
        if (!this.isSpeaking) {
          this.isSpeaking = true;
          this.silenceCount = 0;
          callbacks.onSpeechStart?.();
        }
        this.silenceCount = 0;
        this.buffer.push(new Float32Array(data));
      } else if (this.isSpeaking) {
        this.silenceCount++;
        this.buffer.push(new Float32Array(data));

        if (this.silenceCount >= SILENCE_FRAMES_TO_END) {
          // Assemble full segment
          const total = this.buffer.reduce((s, b) => s + b.length, 0);
          const combined = new Float32Array(total);
          let offset = 0;
          for (const chunk of this.buffer) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          const sr = this.ctx!.sampleRate;
          this.reset();
          callbacks.onSegment(combined, sr);
        }
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.ctx.destination);
  }

  private reset(): void {
    this.buffer = [];
    this.isSpeaking = false;
    this.silenceCount = 0;
  }

  stop(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.reset();
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
