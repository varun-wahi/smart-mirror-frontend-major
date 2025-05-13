import sys
import os
import whisper
from google.cloud import speech
import time
import wave
import subprocess

def get_audio_info(file_path):
    """Get audio information using ffprobe"""
    try:
        cmd = [
            'ffprobe', 
            '-v', 'error',
            '-show_entries', 'stream=sample_rate,codec_name',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        lines = result.stdout.strip().split('\n')
        
        if len(lines) >= 2:
            sample_rate = int(lines[0])
            codec_name = lines[1].lower()
            return sample_rate, codec_name
        return None, None
    except Exception as e:
        print(f"Error getting audio info: {e}")
        return None, None

def transcribe_with_google(file_path, language_code="en-IN"):
    """Transcribe audio file using Google Speech-to-Text API"""
    try:
        # Get audio info
        sample_rate, codec_name = get_audio_info(file_path)
        if not sample_rate:
            print("Couldn't determine audio sample rate. Using default configuration.")
            sample_rate = 48000  # Default to 48000 for WEBM files
        
        # Determine encoding based on codec
        encoding = speech.RecognitionConfig.AudioEncoding.ENCODING_UNSPECIFIED
        if codec_name:
            if 'opus' in codec_name:
                encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
            elif 'pcm' in codec_name or 'wav' in codec_name:
                encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
            elif 'flac' in codec_name:
                encoding = speech.RecognitionConfig.AudioEncoding.FLAC
            elif 'mp3' in codec_name:
                encoding = speech.RecognitionConfig.AudioEncoding.MP3
        
        # Instantiate a client
        client = speech.SpeechClient()

        # Read the audio file
        with open(file_path, "rb") as audio_file:
            content = audio_file.read()

        # Configure audio settings
        audio = speech.RecognitionAudio(content=content)
        
        # Configure recognition settings
        config = speech.RecognitionConfig(
            encoding=encoding,
            sample_rate_hertz=sample_rate,
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
    language_code = sys.argv[2] if len(sys.argv) > 2 else "en-IN"
    model_name = sys.argv[3] if len(sys.argv) > 3 else "tiny.en"
    
    result = transcribe_audio(file_path, language_code, model_name)
    if result:
        print("\nTranscription result:")
        print(result)
    else:
        print("Transcription failed using both methods.")