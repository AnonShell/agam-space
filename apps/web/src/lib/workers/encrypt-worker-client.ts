export class EncryptWorkerClient {
  private worker: Worker;

  constructor(workerUrl: URL) {
    this.worker = new Worker(workerUrl, { type: 'module' });
  }

  encryptChunk(
    chunkIndex: number,
    chunk: Uint8Array,
    fileKey: Uint8Array
  ): Promise<{ encChunk: Uint8Array; checksum: string }> {
    return new Promise((resolve, reject) => {
      //TODO fallback ?

      this.worker.onmessage = e => resolve(e.data);
      this.worker.onerror = e => {
        console.error('[Worker Error]', e);
        reject(e);
      };
      this.worker.postMessage({ chunkIndex, chunk, fileKey }, [chunk.buffer, fileKey.buffer]);
    });
  }

  destroy(): void {
    this.worker.terminate();
  }
}
