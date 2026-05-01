import axios, { AxiosError } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120_000,
  headers: { 'Accept': 'application/json' },
});

// Types
export interface AnalysisResult {
  filename: string;
  content_type?: string;
  duration: number;
  sample_rate: number;
  channels: number;
  bpm: number;
  key: string;
  scale?: string;
  time_signature: string;
  energy: number;
  danceability: number;
  valence: number;
  loudness: number;
  stereo_width: number;
  groove: number;
  swing: number;
  genre: { primary: string; secondary: string; confidence: number };
  mood: { primary: string; secondary: string };
  waveform: number[];
  beats: number[];
  sections: SectionPoint[];
  stems: Record<string, { level: number; active: boolean }>;
  instruments: Array<{ name: string; confidence: number }>;
  similar_artists: Array<{ name: string; similarity: number }>;
  spectral: Record<string, number>;
  frequency_spectrum: Array<{ band: string; value: number }>;
  energy_curve: Array<{ time: number; value: number }>;
  beat_timeline: Array<{ time: number; strength: number }>;
  mixing: {
    compression: number;
    eq_balance: string;
    clarity: number;
    headroom_db: number;
  };
  rhythm: {
    pattern: string;
    beat_structure: string;
    bassline: string;
    chords: string;
    melody: string;
  };
  lyrics: string;
  audio: AudioLayer;
  vocals: VocalLayer;
  lyrics_analysis: LyricsLayer;
  insights: InsightLayer;
}

export interface SectionPoint {
  label: string;
  start: number;
  end: number;
  color: string;
}

export type AudioLayer = Omit<AnalysisResult, 'audio' | 'vocals' | 'lyrics_analysis' | 'insights' | 'genre' | 'mood' | 'similar_artists' | 'lyrics'>;

export interface VocalLayer {
  presence: number;
  clarity: number;
  autotune: number;
  pitch_accuracy: number;
  flow: string;
  bar_structure: string;
  cadence: string;
}

export interface LyricsLayer {
  transcript: string;
  rhyme_scheme: string;
  multi_syllable_density: number;
  punchlines: string[];
  metaphors: string[];
  sentiment: string;
  emotion: string;
  lyric_density: Array<{ section: string; density: number }>;
}

export interface InsightLayer {
  genre: { primary: string; secondary: string; confidence: number };
  mood: { primary: string; secondary: string };
  similar_artists: Array<{ name: string; similarity: number }>;
  commercial_viability: number;
  vibe_fingerprint: string;
  sub_genre_tags: string[];
  strengths: string[];
  opportunities: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export interface UploadData {
  song_id: string;
  status: string;
  analysis: AnalysisResult;
}

interface UploadEnvelope extends ApiResponse<UploadData> {
  song_id?: string;
  status?: string;
  analysis?: AnalysisResult;
}

// API Functions
export async function uploadSong(file: File): Promise<ApiResponse<UploadData>> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadEnvelope>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (data.data?.analysis) return data as ApiResponse<UploadData>;
  if (data.song_id && data.analysis) {
    return {
      success: data.success,
      data: {
        song_id: data.song_id,
        status: data.status || 'completed',
        analysis: data.analysis,
      },
      error: data.error,
    };
  }
  throw new Error('Analysis response did not include renderable results.');
}

export async function getAnalysis(songId: string): Promise<ApiResponse<AnalysisResult>> {
  const { data } = await api.get<ApiResponse<AnalysisResult>>(`/analysis/${songId}`);
  return data;
}

export async function checkHealth(): Promise<{ status: string; mock_mode: boolean }> {
  const { data } = await api.get('/health');
  return data;
}

// ───────── Compare ─────────
export interface ComparisonTrack {
  song_id: string;
  filename: string;
  bpm: number;
  key: string;
  energy: number;
  danceability: number;
  loudness: number;
  valence: number;
  genre: { primary: string; secondary: string; confidence: number };
  mood: { primary: string; secondary: string };
  commercial_viability: number;
  vocal_presence: number;
  stereo_width: number;
}

export interface ComparisonResult {
  track_a: ComparisonTrack;
  track_b: ComparisonTrack;
  deltas: Record<string, number | null>;
  verdict: string;
}

export async function compareSongs(fileA: File, fileB: File): Promise<ApiResponse<ComparisonResult>> {
  const formData = new FormData();
  formData.append('file_a', fileA);
  formData.append('file_b', fileB);
  const { data } = await api.post<ApiResponse<ComparisonResult>>('/compare', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ───────── AI Explain ─────────
export interface LineExplanation {
  line: string;
  meaning: string;
  devices: string[];
  cultural_refs: string[];
}

export interface ExplainResult {
  song_id: string;
  line_explanations: LineExplanation[];
  metaphor_breakdown: Array<{ phrase: string; explanation: string }>;
  overall_theme: string;
  sentiment_arc: string;
}

export async function explainLyrics(songId: string): Promise<ApiResponse<ExplainResult>> {
  const { data } = await api.post<ApiResponse<ExplainResult>>('/explain', { song_id: songId });
  return data;
}

// ───────── Export ─────────
export async function exportData(songId: string, format: 'midi' | 'chords' | 'drums' | 'summary'): Promise<ApiResponse<any>> {
  const { data } = await api.get<ApiResponse<any>>(`/export/${songId}/${format}`);
  return data;
}

export interface GenerationRequest {
  genre: string;
  bpm: number;
  mood: string;
  key?: string;
}

export interface GeneratedMusic {
  bpm: number;
  genre: string;
  mood: string;
  key: string;
  drum_pattern: Array<{ step: number; kick: boolean; snare: boolean; hihat: boolean; open_hat: boolean }>;
  bassline: Array<{ note: string; step: number; duration: number; velocity: number }>;
  melody: Array<{ note: string; step: number; duration: number; velocity: number }>;
  chords: string[];
  arrangement: Array<{ section: string; bars: number; energy: number }>;
}

export async function generateBeat(payload: GenerationRequest): Promise<ApiResponse<GeneratedMusic>> {
  const { data } = await api.post<ApiResponse<GeneratedMusic>>('/ai/generate', payload);
  return data;
}

export async function improveSong(songId: string): Promise<ApiResponse<any>> {
  const { data } = await api.post<ApiResponse<any>>('/ai/improve', { song_id: songId });
  return data;
}

export async function exportProject(payload: Record<string, unknown>): Promise<ApiResponse<any>> {
  const { data } = await api.post<ApiResponse<any>>('/project/export', payload);
  return data;
}

// ───────── Fingerprint ─────────
export interface FingerprintResult {
  song_id: string;
  embedding: number[];
  dimensions: number;
  similar_songs: Array<{ song_id: string; filename: string; similarity: number }>;
  fingerprint_hash: string;
}

export async function getFingerprint(songId: string): Promise<ApiResponse<FingerprintResult>> {
  const { data } = await api.get<ApiResponse<FingerprintResult>>(`/fingerprint/${songId}`);
  return data;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.detail || error.response?.data?.error || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
