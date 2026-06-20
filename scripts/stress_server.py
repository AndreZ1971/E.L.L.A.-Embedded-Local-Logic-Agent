#!/usr/bin/env python3
"""
ELLA Stress Analysis Server — Port 3004
Analyzes voice audio (WAV) for stress indicators using stdlib + numpy only.
"""
import io
import json
import sys
import wave
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Tuple

import numpy as np

STRESS_PORT = 3004


def load_wav(data: bytes) -> Tuple[np.ndarray, int]:
    """Parse WAV bytes → float32 mono array + sample rate."""
    with wave.open(io.BytesIO(data), "rb") as wf:
        sr = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
        n_ch = wf.getnchannels()
        sw = wf.getsampwidth()

    if sw == 2:
        audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sw == 4:
        audio = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        audio = np.frombuffer(raw, dtype=np.uint8).astype(np.float32) / 128.0 - 1.0

    if n_ch > 1:
        audio = audio.reshape(-1, n_ch).mean(axis=1)

    return audio, sr


def analyze_stress(audio: np.ndarray, sr: int) -> dict:
    """
    Extract lightweight stress indicators from audio.
    Returns stress level (low/medium/high) + raw features for debugging.
    """
    min_samples = int(sr * 0.1)  # need at least 100 ms
    if len(audio) < min_samples:
        return {"stress": "low", "score": 0}

    # 1. RMS energy — stressed speech is louder / more forceful
    rms = float(np.sqrt(np.mean(audio**2)))

    # 2. Zero-crossing rate — proxy for speech tension and rate
    zcr = float(np.mean(np.abs(np.diff(np.sign(audio))) / 2))

    # 3. Pitch via autocorrelation — stressed voices pitch higher
    frame_len = min(int(sr * 0.05), len(audio))
    frame = audio[:frame_len]
    ac = np.correlate(frame, frame, mode="full")
    ac = ac[len(ac) // 2 :]
    min_lag = max(1, int(sr / 400))  # ≤ 400 Hz
    max_lag = min(int(sr / 80), len(ac) - 1)  # ≥ 80 Hz
    pitch = 0.0
    if max_lag > min_lag:
        peak = int(np.argmax(ac[min_lag:max_lag])) + min_lag
        pitch = float(sr / peak) if peak > 0 else 0.0

    # Stress score: each indicator contributes 1 point (max 3)
    score = 0
    if rms > 0.055:   score += 1   # high energy
    if zcr > 0.12:    score += 1   # fast / tense articulation
    if pitch > 210:   score += 1   # elevated fundamental frequency

    level = "low" if score == 0 else "medium" if score == 1 else "high"
    return {
        "stress": level,
        "score": score,
        "rms": round(rms, 4),
        "zcr": round(zcr, 4),
        "pitch": round(pitch, 1),
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # silence default access log
        pass

    def do_GET(self):
        if self.path == "/health":
            self._json({"status": "ok"})
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/analyze":
            self.send_response(404)
            self.end_headers()
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            audio, sr = load_wav(data)
            result = analyze_stress(audio, sr)
            self._json(result)
        except Exception as e:
            # Never crash — return "low" so chat continues normally
            self._json({"stress": "low", "score": 0, "error": str(e)})

    def _json(self, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", STRESS_PORT), Handler)
    print(f"[stress_server] listening on 127.0.0.1:{STRESS_PORT}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
