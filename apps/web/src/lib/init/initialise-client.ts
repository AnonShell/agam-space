import {
  ApiClient,
  ClientRegistry,
  ContentTreeManager,
  DownloadManager,
  DownloadManagerCallbacks,
  getClientRegistry,
  KeyManager,
  UploadManager,
  UploadManagerCallbacks,
} from '@agam-space/client';
import { useDownloadStore } from '@/store/download-store';
import { useUploadStore } from '@/store/upload-store';
import { initCrossTabCommunication } from '@/services/cross-tab';
import { useServerConfigStore } from '@/store/server-config.store';
import { toast } from 'sonner';

let initialized = false;

export function initializeClient() {
  if (initialized) return;
  initialized = true;

  if (!ClientRegistry.hasApiClient()) {
    ClientRegistry.setApiClient(new ApiClient());
  }

  if (!ClientRegistry.hasKeyManager()) {
    ClientRegistry.setKeyManager(new KeyManager());
  }

  if (!ClientRegistry.hasContentTreeManager()) {
    ClientRegistry.setContentTreeManager(new ContentTreeManager());
  }

  if (!ClientRegistry.hasDownloadManager()) {
    ClientRegistry.setDownloadManager(
      new DownloadManager({ concurrency: 2 }, downloadManagerCallbacks)
    );
  }

  if (!ClientRegistry.hasUploadManager()) {
    const serverConfig = useServerConfigStore.getState().config;

    ClientRegistry.setUploadManager(
      new UploadManager(
        {
          concurrency: serverConfig?.upload?.maxConcurrency || 2,
          chunkSize: serverConfig?.upload?.chunkSize || 8_000_000, // 8 MB (decimal)
          maxFileSize: serverConfig?.upload?.maxFileSize || 1_000_000_000,
        },
        uploadManagerCallbacks
      )
    );
  }

  getClientRegistry();

  initCrossTabCommunication();
}

const uploadManagerCallbacks: UploadManagerCallbacks = {
  onStatusChange: (id: string, status) => {
    useUploadStore.getState().updateStatus(id, status);
  },
  onProgress: (id: string, progress) => {
    useUploadStore.getState().updateProgress(id, {
      percent: progress.percent,
      uploadedBytes: progress.uploadedBytes,
      totalBytes: progress.totalBytes,
    });
  },
  onError: (id, error) => {
    console.error(`[bootstrap] UploadManager error for ${id}:`, error);
    // Don't show toast for file size validation errors - they show in upload tray
    // Only show toast for unexpected errors during upload
    const isFileSizeError = error.includes('exceeds maximum limit');
    if (!isFileSizeError) {
      toast.error(error);
    }
    useUploadStore.getState().updateStatus(id, 'error');
    useUploadStore.getState().setError(id, error);
  },
};

const downloadManagerCallbacks: DownloadManagerCallbacks = {
  onStatusChange: (id: string, status) => {
    useDownloadStore.getState().updateStatus(id, status);
  },
  onProgress: (id: string, progress) => {
    useDownloadStore.getState().updateProgress(id, {
      downloadedBytes: progress.downloadedBytes,
      percent: progress.percent,
    });
  },
  onError: (id, error) => {
    console.error(`[bootstrap] DownloadManager error for ${id}:`, error);
  },
};
