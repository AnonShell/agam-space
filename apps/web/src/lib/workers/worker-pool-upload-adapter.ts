import { WebWorkerPool } from '@/lib/workers/web-worker-pool';
import { UploadWorkerPool } from '@agam-space/client';

export class WorkerPoolEncryptAdapter implements UploadWorkerPool {
  constructor(private readonly pool: WebWorkerPool) {}

  encryptChunk(
    chunkIndex: number,
    chunk: Uint8Array,
    fileKey: Uint8Array
  ): Promise<{ encChunk: Uint8Array; checksum: string }> {
    return this.pool.run(worker => worker.encryptChunk(chunkIndex, chunk, fileKey));
  }
}
