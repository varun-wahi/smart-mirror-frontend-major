#!/usr/bin/env python3
import json
import os
import subprocess
from vosk import Model, KaldiRecognizer, SetLogLevel

# Configuration - EDIT THESE PATHS
AUDIO_FILE_PATH = "/Users/varunwahi/Development/Interview_Prep/frontend/src/controlApp/scripts/test_voice.wav"  # CHANGE THIS to your audio file path
MODEL_PATH = "/Users/varunwahi/Development/Interview_Prep/frontend/src/controlApp/scripts/voice_models/vosk-model-small-en-in-0.4"  # CHANGE THIS to your model path

def convert_to_wav(input_path):
    """Convert audio to WAV format if needed"""
    file_ext = os.path.splitext(input_path)[1].lower()
    
    # If it's already a WAV file, return the original path
    if file_ext == '.wav':
        return input_path
        
    # Otherwise convert to WAV
    output_path = os.path.splitext(input_path)[0] + "_converted.wav"
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-ar", "16000", "-ac", "1",
            "-f", "wav", output_path
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"Converted {input_path} to {output_path}")
        return output_path
    except Exception as e:
        print(f"Error converting audio: {e}")
        return input_path  # Return original path if conversion fails

def transcribe_audio():
    """Transcribe audio and print the result"""
    # Suppress log messages
    SetLogLevel(-1)
    
    try:
        # Make sure we have a WAV file
        wav_path = convert_to_wav(AUDIO_FILE_PATH)
        
        # Load the model
        print(f"Loading model from {MODEL_PATH}...")
        model = Model(MODEL_PATH)
        print("Model loaded successfully")
        
        # Open the audio file
        print(f"Opening audio file {wav_path}...")
        wf = wave.open(wav_path, "rb")
        
        # Create a recognizer
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True)
        
        # Process the audio file
        print("Transcribing...")
        result = ""
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                part_result = json.loads(rec.Result())
                result += part_result.get("text", "") + " "
        
        # Get final result
        part_result = json.loads(rec.FinalResult())
        result += part_result.get("text", "")
        
        # Print the transcription
        print("\n----- TRANSCRIPTION RESULT -----")
        print(result.strip())
        print("---------------------------------\n")
        
        # Clean up temporary file if needed
        if wav_path != AUDIO_FILE_PATH and os.path.exists(wav_path):
            os.remove(wav_path)
            
    except Exception as e:
        print(f"Error during transcription: {e}")

if __name__ == "__main__":
    # Import here to avoid dependency issues if running as a module
    import wave
    transcribe_audio()