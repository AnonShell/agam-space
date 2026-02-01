import { initCrossTabCommunication } from '@/services/cross-tab';
import { ServerConfigService } from '@/services/server-config.service';
import { useDownloadStore } from '@/store/download-store';
import { useUploadStore } from '@/store/upload-store';
import {
  ApiClient,
  ClientRegistry,
  ContentTreeManager,
  CryptoKeyOperationsService,
  DownloadManager,
  DownloadManagerCallbacks,
  getClientRegistry,
  KeyManager,
  UploadManager,
  UploadManagerCallbacks,
} from '@agam-space/client';
import { toast } from 'sonner';
import { CryptoKeyOperationsWorkerClient } from '@/lib/crypto/crypto-key-operations-worker-client';
import { logger } from '@/lib/logger';

let initialized = false;

function isWebWorkerAvailable(): boolean {
  const envEnabled = process.env.NEXT_PUBLIC_USE_CRYPTO_KEYS_WORKER !== 'false';
  return (
    envEnabled &&
    typeof window !== 'undefined' &&
    'Worker' in window &&
    typeof import.meta?.url !== 'undefined'
  );
}

export async function initializeClient(isPublic: boolean = false) {
  if (initialized) return;
  initialized = true;

  logger.debug('[initializeClient]', `Initializing client (public: ${isPublic})...`);

  if (!ClientRegistry.hasApiClient()) {
    ClientRegistry.setApiClient(new ApiClient());
  }

  if (!ClientRegistry.hasKeyManager()) {
    ClientRegistry.setKeyManager(new KeyManager());
  }

  if (!ClientRegistry.hasCryptoKeyOperationsService()) {
    ClientRegistry.setCryptoKeyOperationsService(
      isWebWorkerAvailable()
        ? new CryptoKeyOperationsWorkerClient()
        : new CryptoKeyOperationsService()
    );
  }

  if (!ClientRegistry.hasDownloadManager()) {
    ClientRegistry.setDownloadManager(
      new DownloadManager({ concurrency: 2 }, downloadManagerCallbacks)
    );
  }

  // authenticated-only services
  if (!isPublic) {
    if (!ClientRegistry.hasContentTreeManager()) {
      ClientRegistry.setContentTreeManager(new ContentTreeManager());
    }

    let serverConfig;
    try {
      serverConfig = await ServerConfigService.getConfig();
    } catch (error) {
      console.error('❌ Error fetching server config:', error);
    }

    if (!ClientRegistry.hasUploadManager()) {
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

  logger.debug('[initializeClient]', `Client registry ready (public: ${isPublic})`);
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
