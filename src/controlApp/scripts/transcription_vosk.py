import sys
import json
import os
import wave
import subprocess
import tempfile
from vosk import Model, KaldiRecognizer, SetLogLevel

def convert_webm_to_wav(webm_path):
    wav_path = tempfile.mktemp(suffix=".wav")
    command = ["ffmpeg", "-y", "-i", webm_path, "-ar", "16000", "-ac", "1", "-f", "wav", wav_path]
    subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return wav_path

def transcribe_audio(file_path, model_path):
    SetLogLevel(-1)

    if not os.path.exists(model_path):
        raise Exception(f"Model path does not exist: {model_path}")
    
    try:
        # Load the model (no print here)
        model = Model(model_path)

        # Convert .webm to .wav
        wav_path = convert_webm_to_wav(file_path)

        wf = wave.open(wav_path, "rb")
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True)

        result = ""
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                part_result = json.loads(rec.Result())
                result += part_result.get("text", "") + " "

        part_result = json.loads(rec.FinalResult())
        result += part_result.get("text", "")

        os.remove(wav_path)  # Clean up temp file
        return result.strip()

    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcription_vosk.py [audio_file] [vosk_model_path]")
        sys.exit(1)

    file_path = sys.argv[1]
    model_path = sys.argv[2] if len(sys.argv) > 2 else "vosk-model-small-en-in-0.4"
    print(transcribe_audio(file_path, model_path))