#!/usr/bin/env python3
"""
E.L.L.A. Kokoro TTS Server — Port 3003
Synthesisiert Text lokal mit Kokoro-ONNX und spielt ihn direkt ab.
Fallback: Windows SAPI wenn Kokoro nicht installiert ist.

Voraussetzungen:
  pip install kokoro-onnx sounddevice numpy
"""
import json
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from io import BytesIO

PORT = 3003
kokoro_available = False

try:
    from kokoro_onnx import Kokoro
    import sounddevice as sd
    import numpy as np
    kokoro = Kokoro("kokoro-v0_19.onnx", "voices.bin")
    kokoro_available = True
    print(json.dumps({"status": "kokoro_ready"}), flush=True)
except Exception as e:
    print(json.dumps({"status": "kokoro_unavailable", "error": str(e)}), flush=True)


VOICE_MAP = {
    "de": ("af_sarah", "de"),
    "en": ("bf_emma", "en-us"),
    "es": ("ef_dora", "es"),
    "fr": ("ff_siwis", "fr-fr"),
}


def speak_kokoro(text: str, lang: str = "de") -> None:
    voice, kokoro_lang = VOICE_MAP.get(lang, VOICE_MAP["de"])
    samples, sample_rate = kokoro.create(text, voice=voice, speed=1.0, lang=kokoro_lang)
    sd.play(samples, sample_rate)
    sd.wait()


def speak_sapi(text: str) -> None:
    import subprocess
    safe = text.replace("'", "''").replace('"', '""')
    ps = f"Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak('{safe}')"
    subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
        timeout=30,
        capture_output=True,
    )


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # suppress access logs

    def do_POST(self):
        if self.path != "/synthesize":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
            text = str(data.get("text", "")).strip()
            lang = str(data.get("lang", "de")).strip()
        except Exception:
            self.send_response(400)
            self.end_headers()
            return

        if not text:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error":"text required"}')
            return

        try:
            if kokoro_available:
                speak_kokoro(text, lang)
            else:
                speak_sapi(text)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    print(json.dumps({"status": "listening", "port": PORT}), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
