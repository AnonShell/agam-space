import { AbstractFileReader } from '@agam-space/client';
import { RawFileMetadata } from '@agam-space/shared-types';

export class BrowserFileReader implements AbstractFileReader {
  private file: File;

  constructor(file: File) {
    this.file = file;
  }

  get size(): number {
    return this.file.size;
  }

  getMetadata(): RawFileMetadata {
    return {
      name: this.file.name,
      size: this.file.size,
      mimeType: this.file.type,
      modifiedAt: this.file.lastModified ? new Date(this.file.lastModified).toISOString() : null,
    };
  }

  getChunkCount(chunkSize: number): number {
    return Math.ceil(this.size / chunkSize);
  }

  async readChunk(start: number, end: number): Promise<Uint8Array> {
    const blob = this.file.slice(start, end);
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async readFileInChunks(
    chunkSize: number,
    cb: (chunk: Uint8Array, chunkIndex: number, start: number, end: number) => Promise<void>
  ): Promise<void> {
    for (let start = 0; start < this.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, this.size);
      const chunk = await this.readChunk(start, end);
      await cb(chunk, start / chunkSize, start, end);
    }
  }
}
