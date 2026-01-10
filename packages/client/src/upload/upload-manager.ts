import { UploadItem, UploadStatus } from './types';
import { AbstractFileReader } from './abstract-file-reader';
import {
  ApiClientError,
  completeFileUploadApi,
  createNewFileApi,
  uploadFileChunkApi,
} from '../api';
import { FileManager } from '../file-manager';
import { blake3 } from '@noble/hashes/blake3';
import { toHex } from '@agam-space/core';
import { UploadWorkerPool } from './upload-worker-pool';
import { MainThreadUploadWorkerPool } from './main-thread-upload-worker-pool';
import { LimitFunction, pLimiter } from '../utils/p-limiter';
import { ulid } from 'ulid';
import { isFolderIdRoot } from '@agam-space/shared-types';
import { contentTreeStore, FileEntry } from '../content-tree.store';
import { BoundedQueue } from '../utils/bounded-queue';
import { formatBytes } from '../utils/format';

export interface UploadProgress {
  percent: number; // rounded %
  uploadedBytes: number;
  totalBytes: number;
}

export interface UploadManagerCallbacks {
  onStatusChange?: (id: string, status: UploadStatus, fileEntry?: FileEntry) => void;
  onProgress?: (id: string, progress: UploadProgress) => void;
  onError?: (id: string, error: string) => void;
}

export interface UploadConfig {
  concurrency: number;
  chunkSize: number;
  maxFileSize: number;
}

interface EncryptedChunk {
  index: number;
  data: Uint8Array;
  checksum: string;
}

export class UploadManager {
  private queue: UploadItem[] = [];
  private readonly limiter: LimitFunction;
  private readonly fileManager = new FileManager();
  private readonly workerPool: UploadWorkerPool;

  ENCRYPT_CONCURRENCY = 2;
  UPLOAD_CONCURRENCY = 2;
  QUEUE_CAPACITY = 2;

  constructor(
    private readonly config: UploadConfig = {
      concurrency: 2,
      chunkSize: 8_000_000, // default chunk size 8MB (decimal)
      maxFileSize: 1_000_000_000, // default 1GB
    },
    private readonly callbacks?: UploadManagerCallbacks,
    workerPool?: UploadWorkerPool
  ) {
    this.limiter = pLimiter(this.config.concurrency);
    this.workerPool = workerPool || new MainThreadUploadWorkerPool();
  }

  enqueue(reader: AbstractFileReader, parentFolderId: string | null): UploadItem | null {
    const fileMetadata = reader.getMetadata();
    const fileSize = reader.size;

    // Client-side validation: Check file size before upload
    if (this.config.maxFileSize && fileSize > this.config.maxFileSize) {
      const errorMessage = `File size (${formatBytes(fileSize)}) exceeds maximum limit of ${formatBytes(this.config.maxFileSize)}`;

      // Create an error item so it shows up in the upload tray
      const errorItem: UploadItem = {
        id: ulid(),
        fileMetadata,
        fileReader: reader,
        parentId: parentFolderId,
        status: 'error',
        error: errorMessage,
        progress: 0,
      };

      // Notify via callback so the UI can show the error
      this.callbacks?.onError?.(errorItem.id, errorMessage);

      return errorItem;
    }

    const item: UploadItem = {
      id: ulid(),
      // fileMetadata: {} as any,
      // fileReq: {} as any,
      fileReader: reader,
      parentId: parentFolderId,
      status: 'pending',
      progress: 0,
    };

    this.queue.push(item);
    this.process(item);
    return item;
  }

  private async process(item: UploadItem) {
    await this.limiter(async () => {
      try {
        const start = performance.now();

        item.status = 'encrypting';
        this.callbacks?.onStatusChange?.(item.id, item.status);

        item.fileMetadata = item.fileReader.getMetadata();
        //TODO need extend to include user metadata
        const req = await new FileManager().prepareNewFileUpload(item.fileMetadata!, item.parentId);

        const t0 = performance.now();

        item.fileReq = {
          nameHash: req.nameHash,
          metadataEncrypted: req.metadataEncrypted,
          fkWrapped: req.fkWrapped,
          parentId: isFolderIdRoot(item.parentId) ? null : item.parentId,
          chunkCount: item.fileReader.getChunkCount(this.config.chunkSize),
        };

        await this.uploadFileV2(item, req.fileKey);

        console.log(
          `Upload completed for ${item.fileId} in ${(performance.now() - start).toFixed(2)}ms`
        );
      } catch (e: any) {
        if (e instanceof ApiClientError && (e as ApiClientError).isConflict()) {
          // Handle conflict error (e.g. file already exists, file size limit, quota exceeded)
          item.status = 'error';
          item.error = e.message || 'File already exists';
          this.callbacks?.onError?.(item.id, item.error!);
        } else {
          console.error(`Error processing upload item ${item.id}:`, e);
          item.status = 'error';
          item.error = e.message || 'Unknown error';
          this.callbacks?.onError?.(item.id, item.error!);
        }
      }
    });
  }

  private updateItemStatus(item: UploadItem, status: UploadStatus, error?: string) {
    item.status = status;
    if (error) {
      item.error = error;
      this.callbacks?.onError?.(item.id, item.error!);
    } else {
      item.error = undefined;
      this.callbacks?.onStatusChange?.(item.id, status);
    }
  }

  private async uploadFile(item: UploadItem, fileKey: Uint8Array) {
    item.status = 'uploading';
    this.callbacks?.onStatusChange?.(item.id, item.status);

    const fileResponse = await createNewFileApi(item.fileReq!);
    item.fileResponse = fileResponse;
    item.fileId = fileResponse.id;
    console.log(`File created with ID: ${fileResponse.id}`);

    const fileHasher = blake3.create();
    let uploadedChunks = 0;
    const totalBytes = item.fileReader.size;
    let uploadedBytes = 0;

    await item.fileReader.readFileInChunks(
      this.config.chunkSize,
      async (chunk: Uint8Array, chunkIndex: number) => {
        console.log(`Uploading chunk ${chunkIndex}/${item.fileReq?.chunkCount}...`);

        const t0 = performance.now();

        const { encChunk, checksum } = await this.workerPool.encryptChunk(
          chunkIndex,
          chunk,
          fileKey
        );

        const t1 = performance.now();

        await uploadFileChunkApi(fileResponse.id, chunkIndex, encChunk, checksum);

        uploadedChunks++;
        uploadedBytes += chunk.length;
        const percent = Math.floor((uploadedBytes / totalBytes) * 100);

        item.progress = percent;

        this.callbacks?.onProgress?.(item.id, {
          percent,
          uploadedBytes,
          totalBytes,
        });

        const t2 = performance.now();

        console.log(`Chunk ${chunkIndex} uploaded successfully, progress: ${item.progress}%`);

        const chunkEncryptTime = t1 - t0;
        const chunkUploadTime = t2 - t1;
        const totalChunkTime = t2 - t0;
        console.log(
          `Chunk ${chunkIndex} processed in ${totalChunkTime.toFixed(2)}ms (encrypt: ${chunkEncryptTime.toFixed(2)}ms, upload: ${chunkUploadTime.toFixed(2)}ms)`
        );
      }
    );

    const fileChecksum = toHex(fileHasher.digest());
    console.log(
      `All ${item.fileReq!.chunkCount} chunks uploaded successfully, checksum: ${fileChecksum}`
    );

    await completeFileUploadApi(fileResponse.id, fileChecksum);
    console.log('✅ File uploaded successfully');

    item.status = 'complete';
    item.progress = 100;

    this.callbacks?.onStatusChange?.(item.id, item.status, this.toFileEntry(item));
    contentTreeStore.updateEntry(this.toFileEntry(item));
  }

  private async uploadFileV2(item: UploadItem, fileKey: Uint8Array) {
    this.updateItemStatus(item, 'uploading');

    const t0 = performance.now();

    const fileResponse = await createNewFileApi(item.fileReq!);
    item.fileResponse = fileResponse;
    item.fileId = fileResponse.id;
    console.log(`File created with ID: ${fileResponse.id}`);

    const fileChecksum = await this.uploadFilePipelined(item, fileKey);
    console.log(`All ${item.fileReq!.chunkCount} chunks uploaded successfully`);

    const t1 = performance.now();

    await completeFileUploadApi(fileResponse.id, fileChecksum);
    console.log('✅ File uploaded successfully, took : ', (t1 - t0).toFixed(2), 'ms');

    item.status = 'complete';
    item.progress = 100;

    this.callbacks?.onStatusChange?.(item.id, item.status, this.toFileEntry(item));
    contentTreeStore.updateEntry(this.toFileEntry(item));
  }

  private async uploadFilePipelined(item: UploadItem, fileKey: Uint8Array): Promise<string> {
    const queue = new BoundedQueue<EncryptedChunk>(this.QUEUE_CAPACITY);
    const fileReader = item.fileReader;

    // Store chunk checksums in order for file-level checksum computation
    const chunkChecksums: string[] = new Array(item.fileReq!.chunkCount);
    let uploadedChunks = 0;
    const totalBytes = item.fileReader.size;
    let uploadedBytes = 0;

    const encryptLimiter = pLimiter(this.ENCRYPT_CONCURRENCY);
    const uploadLimiter = pLimiter(this.UPLOAD_CONCURRENCY);

    const uploadWorker = async () => {
      while (true) {
        const chunkItem = await queue.pop();
        if (chunkItem === null) break;

        await uploadFileChunkApi(
          item.fileResponse?.id!,
          chunkItem.index,
          chunkItem.data,
          chunkItem.checksum
        );

        // Store checksum at correct index
        chunkChecksums[chunkItem.index] = chunkItem.checksum;

        uploadedChunks++;
        uploadedBytes += chunkItem.data.length;
        const percent = Math.floor((uploadedBytes / totalBytes) * 100);

        item.progress = percent;

        this.callbacks?.onProgress?.(item.id, {
          percent,
          uploadedBytes,
          totalBytes,
        });
      }
    };

    // create n upload workers based on UPLOAD_CONCURRENCY
    const uploadTasks = Array.from({ length: this.UPLOAD_CONCURRENCY }).map(() =>
      uploadLimiter(uploadWorker)
    );

    await fileReader.readFileInChunks(
      this.config.chunkSize,
      async (chunk, chunkIndex, _start, _end) => {
        await encryptLimiter(async () => {
          const { encChunk, checksum } = await this.workerPool.encryptChunk(
            chunkIndex,
            chunk,
            fileKey
          );
          await queue.push({ index: chunkIndex, data: encChunk, checksum: checksum });
        });
      }
    );

    queue.signalPushComplete();

    await Promise.all(uploadTasks);

    // Compute file-level checksum from chunk checksums
    const fileHasher = blake3.create();
    for (const chunkChecksum of chunkChecksums) {
      fileHasher.update(chunkChecksum);
    }
    const fileChecksum = toHex(fileHasher.digest());

    console.log(`File checksum computed: ${fileChecksum}`);
    return fileChecksum;
  }

  toFileEntry(item: UploadItem): FileEntry {
    if (!item.fileId || !item.fileMetadata || !item.fileResponse) {
      throw new Error('Cannot convert to FileEntry: missing fileId or fileMetadata');
    }
    return {
      id: item.fileResponse.id,
      name: item.fileMetadata.name,
      size: item.fileMetadata.size,
      mime: item.fileMetadata.mimeType || 'application/octet-stream',
      chunkCount: item.fileResponse.chunkCount,
      parentId: item.parentId || 'root',
      isFolder: false,
      createdAt: new Date(item.fileMetadata.createdAt!),
      updatedAt: new Date(item.fileMetadata.modifiedAt!),
      metadata: {
        ...item.fileMetadata,
      },
    };
  }
}
