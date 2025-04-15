import sys
import whisper

def transcribe_audio(file_path, model_name="tiny.en"):
    model = whisper.load_model(model_name)
    result = model.transcribe(file_path)
    print(result["text"])

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py [audio_file] [model_name]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "tiny.en"
    transcribe_audio(file_path, model_name)