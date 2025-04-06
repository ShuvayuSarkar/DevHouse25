import os
import queue
import sounddevice as sd
import numpy as np
from pyannote.audio.pipelines import SpeakerDiarization
from vosk import Model, KaldiRecognizer
from pydub import AudioSegment
import json
from scipy.io.wavfile import write
import torch
import onnxruntime

#ಸ

# Configuration
LANGUAGE_MODELS = {
    "en": "vosk-model-small-en-in-0.4",
    "hi": "vosk-model-small-hi-0.22",    # Hindi
    "gu": "vosk-model-small-gu-0.42",   # Gujarati
    "te": "vosk-model-small-te-0.42"    # Telugu
}
HF_TOKEN = "TOKEN"
SAMPLE_RATE = 16000
CHANNELS = 1
SILENCE_TIMEOUT = 2  # Seconds of silence to stop recording

# Load Silero VAD model
def load_vad_model():
    model, utils = torch.hub.load(
        repo_or_dir='snakers4/silero-vad',
        model='silero_vad',
        force_reload=True,
        onnx=True
    )
    return model, utils

model, utils = load_vad_model()
(get_speech_timestamps, _, read_audio, *_) = utils

# Load Vosk models for all languages
def load_vosk_models():
    models = {}
    for lang, model_path in LANGUAGE_MODELS.items():
        if os.path.exists(model_path):
            models[lang] = Model(model_path)
        else:
            print(f"Warning: Model for {lang} not found at {model_path}")
    return models

vosk_models = load_vosk_models()

# ----------------------------
# Step 1: Voice-Controlled Recording
# ----------------------------
def record_audio():
    """Start recording when speech is detected, stop after silence"""
    print("Waiting for speech to begin...")
    
    audio_queue = queue.Queue()
    recorded_chunks = []
    is_recording = False
    last_speech_time = 0

    def callback(indata, frames, time, status):
        audio_queue.put(indata.copy())
    
    with sd.InputStream(callback=callback,
                       channels=CHANNELS,
                       samplerate=SAMPLE_RATE,
                       dtype='int16'):
        while True:
            try:
                chunk = audio_queue.get(timeout=1)
            except queue.Empty:
                continue

            audio_float = chunk.astype(np.float32) / 32768.0
            
            speech_ts = get_speech_timestamps(
                audio_float,
                model,
                threshold=0.5,
                sampling_rate=SAMPLE_RATE
            )

            if len(speech_ts) > 0:
                if not is_recording:
                    print("\nRecording started...")
                    is_recording = True
                last_speech_time = time.time()
                recorded_chunks.append(chunk)
            elif is_recording:
                if (time.time() - last_speech_time) > SILENCE_TIMEOUT:
                    print("\nRecording stopped.")
                    break
                recorded_chunks.append(chunk)

    if len(recorded_chunks) > 0:
        audio_data = np.concatenate(recorded_chunks, axis=0)
        write("temp.wav", SAMPLE_RATE, audio_data)
        return AudioSegment.from_wav("temp.wav")
    return None

# ----------------------------
# Step 2: Speaker Diarization
# ----------------------------
def get_speaker_timestamps():
    pipeline = SpeakerDiarization.from_pretrained("pyannote/speaker-diarization",
                                                use_auth_token=HF_TOKEN)
    audio_file = "temp.wav"
    diarization = pipeline(audio_file)
    return diarization.for_json()['content']

# ----------------------------
# Step 3: Speech-to-Text with Language Detection
# ----------------------------
def transcribe_segment(segment, language="auto"):
    """Transcribe audio segment with automatic language detection if needed"""
    segment.export("temp_segment.wav", format="wav")
    audio = read_audio("temp_segment.wav", sampling_rate=SAMPLE_RATE)
    
    if language == "auto":
        # Try all languages and pick the one with most confident result
        results = {}
        for lang, model in vosk_models.items():
            rec = KaldiRecognizer(model, SAMPLE_RATE)
            rec.AcceptWaveform(audio.tobytes())
            result = json.loads(rec.Result())
            results[lang] = (result.get('text', ''), result.get('confidence', 0))
        
        # Select language with highest confidence
        best_lang = max(results.items(), key=lambda x: x[1][1])[0]
        text = results[best_lang][0]
    else:
        rec = KaldiRecognizer(vosk_models[language], SAMPLE_RATE)
        rec.AcceptWaveform(audio.tobytes())
        text = json.loads(rec.Result()).get('text', '')
    
    os.remove("temp_segment.wav")
    return text

# ----------------------------
# Main Workflow
# ----------------------------
if __name__ == "__main__":
    try:
        print("Available languages: English (en), Hindi (hi), Gujarati (gu), Telugu (te)")
        lang_choice = input("Enter language code or 'auto' for auto-detection: ").lower()
        
        if lang_choice not in LANGUAGE_MODELS and lang_choice != "auto":
            print("Invalid language choice, defaulting to auto-detection")
            lang_choice = "auto"
            
        input("Press Enter and start speaking...")
        audio = record_audio()
        
        if audio is None:
            print("No speech detected")
            exit()

        # Process audio
        speaker_segments = get_speaker_timestamps()
        
        for segment, _, speaker in speaker_segments:
            start = segment.start
            end = segment.end
            chunk = audio[int(start*1000):int(end*1000)]
            text = transcribe_segment(chunk, language=lang_choice)
            print(f"[{speaker}] {start:.1f}-{end:.1f}s: {text}")
            
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        if os.path.exists("temp.wav"):
            os.remove("temp.wav")
