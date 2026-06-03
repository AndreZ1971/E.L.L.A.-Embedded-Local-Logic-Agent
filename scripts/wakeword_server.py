#!/usr/bin/env python3
"""
Persistent wakeword inference server.
Reads newline-delimited JSON from stdin, writes JSON results to stdout.
Input:  {"audio_path": "/path/to/file.wav"}
Output: {"score": 0.85, "detected": true}
"""

import sys
import json
import os
import numpy as np
import onnxruntime as ort
import soundfile as sf
import subprocess
import tempfile

# Silence onnxruntime warnings
ort.set_default_logger_severity(3)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "apps", "api", "wakeword-models")

MEL_PATH = os.path.join(MODEL_DIR, "melspectrogram.onnx")
EMB_PATH = os.path.join(MODEL_DIR, "embedding_model.onnx")
ELLA_PATH = os.path.join(MODEL_DIR, "ella.onnx")

TARGET_SR = 16000
AUDIO_SAMPLES = 20480  # 1.28s
MEL_WIN = 76
MEL_STRIDE = 8
N_EMB = 7
THRESHOLD = 0.5


def load_models():
    opts = ort.SessionOptions()
    opts.log_severity_level = 3
    mel = ort.InferenceSession(MEL_PATH, opts)
    emb = ort.InferenceSession(EMB_PATH, opts)
    ella = ort.InferenceSession(ELLA_PATH, opts)
    return mel, emb, ella


def load_audio(path: str) -> np.ndarray:
    try:
        audio, sr = sf.read(path, dtype="float32")
        if sr != TARGET_SR:
            # Resample via ffmpeg
            tmp = tempfile.mktemp(suffix=".wav")
            subprocess.run(
                ["ffmpeg", "-y", "-i", path, "-ar", str(TARGET_SR), "-ac", "1", tmp],
                capture_output=True, check=True
            )
            audio, _ = sf.read(tmp, dtype="float32")
            os.unlink(tmp)
        audio = audio.flatten()
    except Exception:
        audio = np.zeros(AUDIO_SAMPLES, dtype=np.float32)

    if len(audio) < AUDIO_SAMPLES:
        audio = np.pad(audio, (0, AUDIO_SAMPLES - len(audio)))
    return audio[:AUDIO_SAMPLES]


def infer(mel_sess, emb_sess, ella_sess, audio: np.ndarray) -> float:
    # Step 1: melspectrogram
    mel_out = mel_sess.run(None, {"input": audio[np.newaxis, :]})[0]
    mel_frames = mel_out[0, 0]  # [125, 32]

    # Step 2: sliding windows → embeddings
    n = (mel_frames.shape[0] - MEL_WIN) // MEL_STRIDE + 1
    windows = np.stack(
        [mel_frames[i * MEL_STRIDE:i * MEL_STRIDE + MEL_WIN] for i in range(n)]
    )[:, :, :, np.newaxis]  # [n, 76, 32, 1]

    emb_out = emb_sess.run(None, {"input_1": windows})[0]  # [n, 1, 1, 96]
    emb_flat = emb_out[:N_EMB, 0, 0, :]  # [7, 96]

    # Step 3: ella classifier
    score = ella_sess.run(None, {"x": emb_flat[np.newaxis, :, :]})[0][0, 0]
    return float(score)


def main():
    sys.stderr.write("[WAKEWORD] Lade Modelle...\n")
    sys.stderr.flush()

    if not os.path.exists(ELLA_PATH):
        sys.stderr.write(f"[WAKEWORD] Modell nicht gefunden: {ELLA_PATH}\n")
        sys.stderr.flush()
        # Stay alive but return score=0 for every request
        mel_sess = emb_sess = ella_sess = None
    else:
        mel_sess, emb_sess, ella_sess = load_models()
        sys.stderr.write("[WAKEWORD] Modelle bereit.\n")
        sys.stderr.flush()

    # Signal readiness to Node.js
    print(json.dumps({"ready": True}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            audio_path = req.get("audio_path", "")

            if not mel_sess or not audio_path or not os.path.exists(audio_path):
                print(json.dumps({"score": 0.0, "detected": False}), flush=True)
                continue

            audio = load_audio(audio_path)
            score = infer(mel_sess, emb_sess, ella_sess, audio)
            print(json.dumps({"score": score, "detected": score > THRESHOLD}), flush=True)

        except Exception as e:
            print(json.dumps({"score": 0.0, "detected": False, "error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
