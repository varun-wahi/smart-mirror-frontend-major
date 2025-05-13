import sys
import os
import whisper
from google.cloud import speech
import time

def transcribe_with_google(file_path, language_code="en-IN"):
    """Transcribe audio file using Google Speech-to-Text API"""
    try:
        # Instantiate a client
        client = speech.SpeechClient()

        # Read the audio file
        with open(file_path, "rb") as audio_file:
            content = audio_file.read()

        # Configure audio settings
        audio = speech.RecognitionAudio(content=content)
        
        # Configure recognition settings
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,  # May need adjustment based on your audio
            language_code=language_code,
            enable_automatic_punctuation=True,
        )

        # Perform the transcription
        response = client.recognize(config=config, audio=audio)

        # Compile and return the transcript
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "
        
        return transcript.strip()
    
    except Exception as e:
        print(f"Google Speech-to-Text error: {e}")
        return None

def transcribe_with_whisper(file_path, model_name="tiny.en"):
    """Transcribe audio file using local Whisper model as fallback"""
    try:
        print("Falling back to local Whisper model...")
        start_time = time.time()
        model = whisper.load_model(model_name)
        result = model.transcribe(file_path)
        elapsed_time = time.time() - start_time
        print(f"Whisper transcription completed in {elapsed_time:.2f} seconds")
        return result["text"]
    except Exception as e:
        print(f"Whisper error: {e}")
        return None

def transcribe_audio(file_path, language_code="en-IN", model_name="tiny.en"):
    """Transcribe audio, trying Google first, then falling back to Whisper"""
    print("Attempting to transcribe with Google Speech-to-Text...")
    start_time = time.time()
    
    # Try Google Speech-to-Text first
    transcript = transcribe_with_google(file_path, language_code)
    
    if transcript:
        elapsed_time = time.time() - start_time
        print(f"Google transcription completed in {elapsed_time:.2f} seconds")
        return transcript
    else:
        # Fall back to Whisper if Google fails
        return transcribe_with_whisper(file_path, model_name)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py [audio_file] [language_code] [whisper_model_name]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    language_code = sys.argv[2] if len(sys.argv) > 2 else "en-IN"  # Default to en-IN
    model_name = sys.argv[3] if len(sys.argv) > 3 else "tiny.en"
    
    result = transcribe_audio(file_path, language_code, model_name)
    if result:
        print("\nTranscription result:")
        print(result)
    else:
        print("Transcription failed using both methods.")