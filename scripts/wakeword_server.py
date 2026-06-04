#!/usr/bin/env python3
"""
Persistent wakeword inference server using openwakeword.
Reads newline-delimited JSON from stdin, writes JSON results to stdout.
Input:  {"audio_path": "/path/to/file.wav"}
Output: {"score": 0.85, "detected": true}
"""

import sys
import json
import os
import numpy as np
import soundfile as sf
import subprocess
import tempfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "apps", "api", "wakeword-models")
ELLA_PATH = os.path.join(MODEL_DIR, "ella.onnx")

TARGET_SR = 16000
THRESHOLD = 0.3


def load_audio(path: str) -> np.ndarray:
    try:
        audio, sr = sf.read(path, dtype="float32")
        if sr != TARGET_SR:
            tmp = tempfile.mktemp(suffix=".wav")
            subprocess.run(
                ["ffmpeg", "-y", "-i", path, "-ar", str(TARGET_SR), "-ac", "1", tmp],
                capture_output=True, check=True
            )
            audio, _ = sf.read(tmp, dtype="float32")
            os.unlink(tmp)
        audio = audio.flatten()
    except Exception:
        audio = np.zeros(TARGET_SR, dtype=np.float32)

    # openwakeword braucht int16-PCM
    audio = np.clip(audio, -1.0, 1.0)
    return (audio * 32767).astype(np.int16)


def main():
    sys.stderr.write("[WAKEWORD] Lade Modelle...\n")
    sys.stderr.flush()

    if not os.path.exists(ELLA_PATH):
        sys.stderr.write(f"[WAKEWORD] Modell nicht gefunden: {ELLA_PATH}\n")
        sys.stderr.flush()
        oww = None
    else:
        try:
            from openwakeword.model import Model
            oww = Model(wakeword_models=[ELLA_PATH], inference_framework="onnx")
            sys.stderr.write("[WAKEWORD] Modelle bereit.\n")
            sys.stderr.flush()
        except Exception as e:
            sys.stderr.write(f"[WAKEWORD] Ladefehler: {e}\n")
            sys.stderr.flush()
            oww = None

    print(json.dumps({"ready": True}), flush=True)

    model_key = os.path.splitext(os.path.basename(ELLA_PATH))[0]  # "ella"

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            audio_path = req.get("audio_path", "")

            if not oww or not audio_path or not os.path.exists(audio_path):
                print(json.dumps({"score": 0.0, "detected": False}), flush=True)
                continue

            audio = load_audio(audio_path)
            oww.reset()
            # Feed in 80ms chunks (1280 samples) wie openwakeword es erwartet
            CHUNK = 1280
            score = 0.0
            for i in range(0, len(audio) - CHUNK + 1, CHUNK):
                chunk = audio[i:i + CHUNK]
                pred = oww.predict(chunk)
                s = float(pred.get(model_key, 0.0))
                if s > score:
                    score = s

            detected = score > THRESHOLD
            print(json.dumps({"score": score, "detected": detected}), flush=True)

        except Exception as e:
            print(json.dumps({"score": 0.0, "detected": False, "error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
