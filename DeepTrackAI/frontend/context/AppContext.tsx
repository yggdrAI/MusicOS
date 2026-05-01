import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AnalysisResult, uploadSong as apiUploadSong, getErrorMessage } from '../utils/api';

// ───────── State Types ─────────
type AppView = 'home' | 'analysis' | 'studio';
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'rendering' | 'completed' | 'error';

interface AppState {
  view: AppView;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  uploadStage: string;
  currentSongId: string | null;
  currentFilename: string | null;
  analysis: AnalysisResult | null;
  error: string | null;
  activeTab: string;
}

// ───────── Actions ─────────
type Action =
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'UPLOAD_START'; payload: string }
  | { type: 'UPLOAD_PROGRESS'; payload: { progress: number; stage: UploadStatus; label: string } }
  | { type: 'UPLOAD_COMPLETE'; payload: { songId: string; analysis: AnalysisResult } }
  | { type: 'UPLOAD_ERROR'; payload: string }
  | { type: 'SET_TAB'; payload: string }
  | { type: 'RESET' };

// ───────── Reducer ─────────
const initialState: AppState = {
  view: 'home',
  uploadStatus: 'idle',
  uploadProgress: 0,
  uploadStage: 'Ready for upload',
  currentSongId: null,
  currentFilename: null,
  analysis: null,
  error: null,
  activeTab: 'overview',
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'UPLOAD_START':
      return {
        ...state,
        uploadStatus: 'uploading',
        uploadProgress: 0,
        uploadStage: 'Uploading',
        currentFilename: action.payload,
        error: null,
        analysis: null,
      };
    case 'UPLOAD_PROGRESS':
      return {
        ...state,
        uploadStatus: action.payload.stage,
        uploadProgress: action.payload.progress,
        uploadStage: action.payload.label,
      };
    case 'UPLOAD_COMPLETE':
      return {
        ...state,
        uploadStatus: 'completed',
        uploadProgress: 100,
        uploadStage: 'Rendered',
        currentSongId: action.payload.songId,
        analysis: action.payload.analysis,
        view: 'analysis',
      };
    case 'UPLOAD_ERROR':
      return { ...state, uploadStatus: 'error', uploadStage: 'Error', error: action.payload };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ───────── Context ─────────
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  uploadFile: (file: File) => Promise<void>;
  goHome: () => void;
  openStudio: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const uploadFile = useCallback(async (file: File) => {
    dispatch({ type: 'UPLOAD_START', payload: file.name });

    const stages: Array<{ at: number; progress: number; stage: UploadStatus; label: string }> = [
      { at: 180, progress: 18, stage: 'uploading', label: 'Uploading' },
      { at: 700, progress: 42, stage: 'processing', label: 'Audio preprocessing' },
      { at: 1300, progress: 68, stage: 'analyzing', label: 'AI analysis' },
      { at: 1900, progress: 88, stage: 'rendering', label: 'Rendering insights' },
    ];
    const timers = stages.map((step) =>
      window.setTimeout(() => {
        dispatch({ type: 'UPLOAD_PROGRESS', payload: step });
      }, step.at)
    );

    try {
      const response = await apiUploadSong(file);
      timers.forEach(window.clearTimeout);
      dispatch({
        type: 'UPLOAD_PROGRESS',
        payload: { progress: 96, stage: 'rendering', label: 'Rendering insights' },
      });

      if (response.success && response.data) {
        dispatch({
          type: 'UPLOAD_COMPLETE',
          payload: {
            songId: response.data.song_id,
            analysis: response.data.analysis,
          },
        });
      } else {
        dispatch({ type: 'UPLOAD_ERROR', payload: response.error || 'Upload failed' });
      }
    } catch (err) {
      timers.forEach(window.clearTimeout);
      dispatch({ type: 'UPLOAD_ERROR', payload: getErrorMessage(err) });
    }
  }, []);

  const goHome = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const openStudio = useCallback(() => {
    dispatch({ type: 'SET_VIEW', payload: 'studio' });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, uploadFile, goHome, openStudio }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
