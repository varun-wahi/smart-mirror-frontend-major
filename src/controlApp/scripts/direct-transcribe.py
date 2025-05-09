#!/usr/bin/env python3
"""
Simple script to transcribe audio files with Vosk.
Just edit the file paths below and run the script.

Requirements:
- pip install vosk
- ffmpeg installed on your system
"""
import json
import os
import subprocess
import wave
from vosk import Model, KaldiRecognizer, SetLogLevel

# =============================================
# EDIT THESE PATHS BEFORE RUNNING THE SCRIPT
# =============================================
AUDIO_FILE = "/Users/varunwahi/Development/Interview_Prep/frontend/src/controlApp/scripts/test_voice_2.wav"  # CHANGE THIS to your audio file path
MODEL_PATH = "/Users/varunwahi/Development/Interview_Prep/frontend/src/controlApp/scripts/voice_models/vosk-model-small-en-in-0.4"  # CHANGE THIS to your model path
# =============================================

# Turn off Vosk logging
SetLogLevel(-1)

# Convert to WAV if needed
base_name = os.path.splitext(AUDIO_FILE)[0]
wav_file = f"{base_name}.wav"

if not AUDIO_FILE.lower().endswith('.wav'):
    print(f"Converting {AUDIO_FILE} to WAV format...")
    subprocess.run([
        "ffmpeg", "-y", "-i", AUDIO_FILE,
        "-ar", "16000", "-ac", "1",
        "-f", "wav", wav_file
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
else:
    wav_file = AUDIO_FILE

# Load model
print(f"Loading Vosk model...")
model = Model(MODEL_PATH)

# Open WAV file
wf = wave.open(wav_file, "rb")

# Create recognizer
rec = KaldiRecognizer(model, wf.getframerate())
rec.SetWords(True)

# Transcribe
print("Transcribing audio...")
result_text = ""

while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    if rec.AcceptWaveform(data):
        result_json = json.loads(rec.Result())
        result_text += result_json.get("text", "") + " "

# Get final result
result_json = json.loads(rec.FinalResult())
result_text += result_json.get("text", "")

# Print result
print("\n" + "="*50)
print("TRANSCRIPTION RESULT:")
print("="*50)
print(result_text.strip())
print("="*50)

# Cleanup temp file if we created one
if wav_file != AUDIO_FILE and os.path.exists(wav_file):
    os.remove(wav_file)
    print(f"Removed temporary WAV file")

print("\nTranscription complete!")