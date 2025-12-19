import { create } from 'zustand';
import { UploadProgress, UploadStatus } from '@agam-space/client';

interface UploadUIItem {
  id: string;
  parentFolderId: string | null;
  fileName: string;
  fileId?: string;
  status: UploadStatus;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  error?: string;
  dismissed?: boolean;
}

interface UploadState {
  uploads: UploadUIItem[];

  addUpload: (item: UploadUIItem) => void;
  updateProgress: (id: string, progress: UploadProgress) => void;
  updateStatus: (id: string, status: UploadStatus) => void;
  setError: (id: string, error: string) => void;
  updateUpload: (id: string, updates: Partial<UploadUIItem>) => void;
  removeUpload: (id: string) => void;
  clearUploads: () => void;
}

export const useUploadStore = create<UploadState>(set => ({
  uploads: [],

  addUpload: item =>
    set(state => ({
      uploads: [...state.uploads, item],
    })),

  updateProgress: (id, progress) =>
    set(state => ({
      uploads: state.uploads.map(item =>
        item.id === id
          ? {
              ...item,
              progress: progress.percent,
              uploadedBytes: progress.uploadedBytes,
              totalBytes: progress.totalBytes,
            }
          : item
      ),
    })),

  updateStatus: (id, status) =>
    set(state => ({
      uploads: state.uploads.map(item => (item.id === id ? { ...item, status } : item)),
    })),

  setError: (id, error) =>
    set(state => ({
      uploads: state.uploads.map(item =>
        item.id === id ? { ...item, status: 'error', error } : item
      ),
    })),

  updateUpload: (id, updates) =>
    set(state => ({
      uploads: state.uploads.map(item => (item.id === id ? { ...item, ...updates } : item)),
    })),

  removeUpload: id =>
    set(state => ({
      uploads: state.uploads.filter(item => item.id !== id),
    })),

  clearUploads: () => set({ uploads: [] }),
}));
