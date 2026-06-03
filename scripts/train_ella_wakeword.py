#!/usr/bin/env python3
"""
Train openWakeWord model for ELLA wakeword detection.

Usage:
    py -3.12 scripts/train_ella_wakeword.py

Output:
    apps/api/wakeword-models/ella.onnx
    apps/api/wakeword-models/melspectrogram.onnx
    apps/api/wakeword-models/embedding_model.onnx
"""

import os
import sys
import asyncio
import shutil
import numpy as np
import soundfile as sf
import subprocess
import tempfile

# --- Patch scipy compatibility ---
import scipy.special
if not hasattr(scipy.special, "sph_harm"):
    scipy.special.sph_harm = scipy.special.sph_harm_y

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
MODEL_DIR = os.path.join(REPO_ROOT, "apps", "api", "wakeword-models")
TRAIN_DIR = os.path.join(SCRIPT_DIR, "wakeword_training_data")
POS_DIR = os.path.join(TRAIN_DIR, "positive")
NEG_DIR = os.path.join(TRAIN_DIR, "negative")

TARGET_SR = 16000
TARGET_SAMPLES = 20480  # 1.28s at 16kHz — one embed_clips window


# ── 1. Synthetic positive samples via edge-tts ──────────────────────────────

async def generate_positive_samples():
    import edge_tts

    os.makedirs(POS_DIR, exist_ok=True)

    phrases = [
        "Ella", "ella", "Ella.", "ella!", "Ella?",
        "hey Ella", "Hallo Ella", "okay Ella",
        "Ella bitte", "na Ella", "Ella komm",
        "Ella hör zu", "sag mal Ella", "hi Ella",
    ]
    voices = [
        "de-DE-KatjaNeural",
        "de-DE-ConradNeural",
        "de-AT-IngridNeural",
        "de-AT-JonasNeural",
        "de-CH-LeniNeural",
        "de-CH-JanNeural",
    ]

    n = 0
    for voice in voices:
        for phrase in phrases:
            for _ in range(4):
                out = os.path.join(POS_DIR, f"{n:04d}.mp3")
                if not os.path.exists(out):
                    try:
                        comm = edge_tts.Communicate(phrase, voice)
                        await comm.save(out)
                    except Exception as e:
                        print(f"\n  Warnung {phrase}/{voice}: {e}")
                        n += 1
                        continue
                n += 1
                print(f"\r  Positive Samples: {n}", end="", flush=True)

    print(f"\n  ✓ {n} positive Samples")
    return n


# ── 2. Simple negative samples ───────────────────────────────────────────────

def generate_negative_samples(n=400):
    os.makedirs(NEG_DIR, exist_ok=True)
    existing = len([f for f in os.listdir(NEG_DIR) if f.endswith(".wav")])
    if existing >= n:
        print(f"  ✓ {existing} negative Samples bereits vorhanden")
        return

    for i in range(n):
        out = os.path.join(NEG_DIR, f"{i:04d}.wav")
        if os.path.exists(out):
            continue
        if i % 4 == 0:
            audio = np.zeros(TARGET_SAMPLES, dtype=np.int16)
        elif i % 4 == 1:
            white = np.random.randn(TARGET_SAMPLES)
            freqs = np.fft.rfftfreq(TARGET_SAMPLES); freqs[0] = 1e-6
            fft = np.fft.rfft(white) / np.sqrt(freqs)
            audio = np.fft.irfft(fft, n=TARGET_SAMPLES)
            audio = (audio / (np.max(np.abs(audio)) + 1e-8) * 3000).astype(np.int16)
        elif i % 4 == 2:
            audio = (np.random.randn(TARGET_SAMPLES) * 500).astype(np.int16)
        else:
            audio = np.zeros(TARGET_SAMPLES, dtype=np.int16)
            start = np.random.randint(0, TARGET_SAMPLES // 2)
            audio[start:start + TARGET_SAMPLES // 4] = (
                np.random.randn(TARGET_SAMPLES // 4) * 2000
            ).astype(np.int16)
        sf.write(out, audio, TARGET_SR, subtype="PCM_16")

    print(f"  ✓ {n} negative Samples generiert")


# ── 3. Audio loading & feature extraction ───────────────────────────────────

def load_audio_int16(path: str) -> np.ndarray:
    """Load audio file, convert to 16kHz mono int16."""
    tmp = tempfile.mktemp(suffix=".wav")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", path, "-ar", str(TARGET_SR),
             "-ac", "1", "-f", "s16le", "-acodec", "pcm_s16le", tmp],
            capture_output=True, check=True
        )
        audio, _ = sf.read(tmp, dtype="int16")
    except Exception:
        try:
            audio, sr = sf.read(path, dtype="int16")
            if sr != TARGET_SR:
                # Simple resample via scipy
                from scipy.signal import resample
                audio = resample(audio.astype(np.float32),
                                 int(len(audio) * TARGET_SR / sr)).astype(np.int16)
        except Exception as e:
            return None
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)

    audio = audio.flatten()
    if len(audio) < TARGET_SAMPLES:
        audio = np.pad(audio, (0, TARGET_SAMPLES - len(audio)))
    return audio[:TARGET_SAMPLES]


def extract_features(paths: list, af, label: str) -> np.ndarray:
    clips = []
    for p in paths:
        a = load_audio_int16(p)
        if a is not None:
            clips.append(a)

    if not clips:
        return np.empty((0,), dtype=np.float32)

    batch = np.stack(clips, axis=0)  # (N, 20480) int16
    features = af.embed_clips(batch, batch_size=32)
    arr = np.array(features, dtype=np.float32)
    print(f"  {label}: {arr.shape[0]} clips → {arr.shape}")
    return arr


# ── 4. Train & export ────────────────────────────────────────────────────────

def train_and_export():
    import openwakeword
    from openwakeword.train import Model
    from openwakeword.utils import AudioFeatures

    res_dir = os.path.join(os.path.dirname(openwakeword.__file__),
                           "resources", "models")
    mel_path = os.path.join(res_dir, "melspectrogram.onnx")
    emb_path = os.path.join(res_dir, "embedding_model.onnx")

    print("  Initialisiere AudioFeatures...")
    af = AudioFeatures(melspec_model_path=mel_path,
                       embedding_model_path=emb_path)

    pos_files = sorted([os.path.join(POS_DIR, f) for f in os.listdir(POS_DIR)
                        if f.endswith((".mp3", ".wav"))])
    neg_files = sorted([os.path.join(NEG_DIR, f) for f in os.listdir(NEG_DIR)
                        if f.endswith((".mp3", ".wav"))])

    print(f"  Extrahiere Features ({len(pos_files)} pos, {len(neg_files)} neg)...")
    X_pos = extract_features(pos_files, af, "Positiv")
    X_neg = extract_features(neg_files, af, "Negativ")

    if len(X_pos) == 0:
        raise RuntimeError("Keine positiven Features — prüfe Audiodateien & ffmpeg.")

    # input_shape = one sample shape from embed_clips output, e.g. (7, 96)
    sample_shape = X_pos.shape[1:]  # e.g. (7, 96)
    print(f"  Feature-Shape pro Sample: {sample_shape}")

    # Train/val split (85/15)
    n_val = max(2, int(len(X_pos) * 0.15))
    X_pos_train, X_pos_val = X_pos[n_val:], X_pos[:n_val]
    n_neg_train = min(len(X_pos_train) * 3, len(X_neg))
    X_neg_train = X_neg[:n_neg_train]
    X_neg_val = X_neg[n_neg_train:n_neg_train + n_val * 2]

    print(f"  Train: {len(X_pos_train)} pos + {len(X_neg_train)} neg")
    print(f"  Val:   {len(X_pos_val)} pos + {len(X_neg_val)} neg")
    print("  Trainiere Modell (CPU, ~10 Minuten)...")

    model = Model(n_classes=1, input_shape=sample_shape)
    model.auto_train(
        X_train=np.concatenate([X_pos_train, X_neg_train]),
        X_val=np.concatenate([X_pos_val, X_neg_val]),
        false_positive_val_data=X_neg,
        steps=8000,
        target_fp_per_hour=0.5,
    )

    os.makedirs(MODEL_DIR, exist_ok=True)
    onnx_path = os.path.join(MODEL_DIR, "ella.onnx")
    model.export_to_onnx(onnx_path, class_mapping="ella")
    print(f"  ✓ ella.onnx → {onnx_path}")

    for fname in ("melspectrogram.onnx", "embedding_model.onnx"):
        shutil.copy2(os.path.join(res_dir, fname),
                     os.path.join(MODEL_DIR, fname))
    print(f"  ✓ Feature-Modelle kopiert")


# ── main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== ELLA Wakeword Training ===\n")
    print("1. Generiere positive Samples (edge-tts)...")
    asyncio.run(generate_positive_samples())
    print("\n2. Generiere negative Samples (Rauschen)...")
    generate_negative_samples(n=400)
    print("\n3. Trainiere & exportiere Modell...")
    train_and_export()
    print(f"\n✓ Fertig! Modell: {os.path.join(MODEL_DIR, 'ella.onnx')}")
    print("  Starte ELLA neu um das Modell zu laden.")
