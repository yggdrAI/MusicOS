import os
import librosa
import soundfile as sf
import numpy as np
from demucs.apply import apply_model
from demucs.pretrained import get_model as get_demucs_model
import torch

# --- Audio Processing Utilities ---

def process_audio_file(file_path: str, file_id: str):
    # Load audio
    y, sr = librosa.load(file_path, sr=None, mono=False)
    # Extract features
    bpm, _ = librosa.beat.beat_track(y=y, sr=sr)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
    S = librosa.feature.melspectrogram(y=y, sr=sr)
    # Source separation (vocals, drums, bass, other)
    model = get_demucs_model('htdemucs')
    wav = torch.tensor(y).unsqueeze(0)
    stems = apply_model(model, wav, device='cpu')
    # Save stems
    stems_dir = f"results/{file_id}_stems"
    os.makedirs(stems_dir, exist_ok=True)
    for i, name in enumerate(['drums', 'bass', 'other', 'vocals']):
        stem_path = os.path.join(stems_dir, f"{name}.wav")
        sf.write(stem_path, stems[0, i].cpu().numpy(), sr)
    # Return features
    return {
        "bpm": bpm,
        "onsets": onsets.tolist(),
        "mel_spectrogram_shape": S.shape,
        "stems": stems_dir
    }
