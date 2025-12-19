import { create } from 'zustand';

export type DownloadStatus = 'pending' | 'downloading' | 'complete' | 'error';

export interface DownloadUIItem {
  id: string; // file ID or download ID
  fileName: string;
  totalBytes: number;
  downloadedBytes: number;
  progress: number; // 0 - 100
  status: DownloadStatus;
  error?: string;
  dismissed?: boolean;
}

export interface DownloadState {
  downloads: DownloadUIItem[];

  addDownload: (item: DownloadUIItem) => void;
  updateProgress: (id: string, progress: { downloadedBytes: number; percent: number }) => void;
  updateStatus: (id: string, status: DownloadStatus) => void;
  setError: (id: string, error: string) => void;
  updateDownload: (id: string, updates: Partial<DownloadUIItem>) => void;
  removeDownload: (id: string) => void;
  clearDownloads: () => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],

  addDownload: item =>
    set(state => ({
      downloads: [...state.downloads, item],
    })),

  updateProgress: (id, { downloadedBytes, percent }) =>
    set(state => ({
      downloads: state.downloads.map(d =>
        d.id === id
          ? {
              ...d,
              downloadedBytes,
              progress: percent,
            }
          : d
      ),
    })),

  updateStatus: (id, status) =>
    set(state => ({
      downloads: state.downloads.map(d => (d.id === id ? { ...d, status } : d)),
    })),

  setError: (id, error) =>
    set(state => ({
      downloads: state.downloads.map(d => (d.id === id ? { ...d, status: 'error', error } : d)),
    })),

  updateDownload: (id, updates) =>
    set(state => ({
      downloads: state.downloads.map(d => (d.id === id ? { ...d, ...updates } : d)),
    })),

  removeDownload: id =>
    set(state => ({
      downloads: state.downloads.filter(d => d.id !== id),
    })),

  clearDownloads: () => set({ downloads: [] }),
}));
