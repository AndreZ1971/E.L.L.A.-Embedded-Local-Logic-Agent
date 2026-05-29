class VADProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = [];
    this._speaking = false;
    this._silence = 0;
  }

  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;

    let rms = 0;
    for (let i = 0; i < ch.length; i++) rms += ch[i] * ch[i];
    rms = Math.sqrt(rms / ch.length);

    const THRESHOLD = 0.015;
    const SILENCE_FRAMES = 280; // ~750ms at 128 samples/48kHz

    if (rms > THRESHOLD) {
      if (!this._speaking) {
        this._speaking = true;
        this._silence = 0;
        this.port.postMessage({ type: "speechStart" });
      }
      this._silence = 0;
      this._buf.push(ch.slice());
    } else if (this._speaking) {
      this._silence++;
      this._buf.push(ch.slice());
      if (this._silence >= SILENCE_FRAMES) {
        const total = this._buf.reduce((s, b) => s + b.length, 0);
        const out = new Float32Array(total);
        let off = 0;
        for (const b of this._buf) {
          out.set(b, off);
          off += b.length;
        }
        this.port.postMessage({ type: "segment", audio: out }, [out.buffer]);
        this._buf = [];
        this._speaking = false;
        this._silence = 0;
      }
    }
    return true;
  }
}

registerProcessor("vad-processor", VADProcessor);
