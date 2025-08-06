import { createReadStream, createWriteStream, existsSync, mkdirSync, promises as fsPromises, rmSync } from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { Blake3Hasher } from '@napi-rs/blake-hash';
import { Injectable, Logger } from '@nestjs/common';

import { AppConfigService } from '../../config/config.service';

export interface CreateUserDirectoryData {
  userId: string;
}

export interface CreateFolderDirectoryData {
  userId: string;
  folderId: string;
}

export interface CreateFileDirectoryData {
  userId: string;
  folderId: string;
  fileId: string;
}

/**
 * Storage service for managing filesystem operations
 * Uses Unix-style naming: u-<userId>/f/{shard1}/{shard2}/<fileId>/chunk.<index>
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly filesDir: string;

  constructor(private readonly configService: AppConfigService) {
    const directories = this.configService.getDirectories();
    this.filesDir = directories.filesDir;
    this.logger.log(`💾 Storage service initialized with FILES_DIR: ${this.filesDir}`);
  }

  /**
   * Create user directory: <FILES_DIR>/u-<userId>/
   */
  async ensureUserDirectory(userId: string): Promise<string> {
    const userDirPath = this.getUserDirectoryPath(userId);
    this.ensureDirExists(userDirPath);
    return userDirPath;
  }

  async ensureFileDirectory(userId: string, fileId: string): Promise<string> {
    const fileDirPath = this.getFileDirectoryPath(userId, fileId);
    this.ensureDirExists(this.getFileDirectoryPath(userId, fileId));
    return fileDirPath;
  }

  async deleteFileDirectory(userId: string, fileId: string): Promise<string> {
    const fileDirPath = this.getFileDirectoryPath(userId, fileId);
    this.deleteDirectory(fileDirPath);
    return fileDirPath;
  }

  userDirectoryExists(userId: string): boolean {
    return existsSync(this.getUserDirectoryPath(userId));
  }

  ensureDirExists(path: string) {
    if (existsSync(path)) return;
    try {
      mkdirSync(path, { recursive: true });
      this.logger.log(`📁 Created dir path: ${path}`);
    } catch {
      throw new Error(`Failed to create directory: ${path}`);
    }
  }

  deleteDirectory(path: string) {
    if (!existsSync(path)) {
      this.logger.debug(`Directory doesn't exist: ${path}`);
      return;
    }

    try {
      rmSync(path, { recursive: true, force: true });
      this.logger.log(`🗑️ Deleted directory: ${path}`);
    } catch {
      throw new Error(`Failed to delete directory: ${path}`);
    }
  }

  fileDirectoryExists(userId: string, fileId: string): boolean {
    return existsSync(this.getFileDirectoryPath(userId, fileId));
  }

  /**
   * Get user directory path: <FILES_DIR>/u-<userId>
   */
  getUserDirectoryPath(userId: string): string {
    return path.join(this.filesDir, `u-${userId}`);
  }

  /**
   * Get file directory path: <FILES_DIR>/u-<userId>/f/{shard1}/{shard2}/<fileId>
   */
  getFileDirectoryPath(userId: string, fileId: string): string {
    return path.join(this.filesDir, `u-${userId}`, this.getFileShardPath(fileId));
  }

  /**
   * Get chunk file path: <FILES_DIR>/u-<userId>/f/{shared-path}/chunk-<index>
   */
  getChunkFilePath(userId: string, fileId: string, chunkIndex: number): string {
    return path.join(this.getFileDirectoryPath(userId, fileId), `chunk-${chunkIndex}`);
  }

  getRelativeChunkPath(userId: string, fileId: string, chunkIndex: number): string {
    const fullPath = this.getChunkFilePath(userId, fileId, chunkIndex);
    return path.relative(this.filesDir, fullPath);
  }

  getAbsolutePath(relativePath: string): string {
    return path.join(this.filesDir, relativePath);
  }

  getFilesDir(): string {
    return this.filesDir;
  }

  async readChunkStream(userId: string, fileId: string, chunkIndex: number): Promise<Readable> {
    const relativePath = this.getRelativeChunkPath(userId, fileId, chunkIndex);
    const absolutePath = this.getAbsolutePath(relativePath);

    if (!existsSync(absolutePath)) {
      throw new Error(`Chunk file not found: ${relativePath}`);
    }
    return createReadStream(absolutePath);
  }

  /**
   * Get the 2-level sharded relative path for a file (`f/{shard1}/{shard2}/{fileId}`)
   *
   * - Used to evenly distribute files across directories and avoid large folder fanout.
   * - `shard1`: first character of the random part.
   * - `shard2`: next two characters after `shard1`.
   *
   * @param fileId - Full ULID-based file ID
   * @returns relative path using 2-level sharding
   */
  getFileShardPath(fileId: string): string {

    const randomPart = fileId.slice(-16)
    const shard1 = randomPart[0]
    const shard2 = randomPart.slice(1, 3)

    return `f/${shard1}/${shard2}/${fileId}`
  }

  async saveFileChunkStream(
    fileDirPath: string,
    chunkIndex: number,
    stream: Readable,
    checksum: string | undefined = undefined,
    neededChunkSize: number | undefined = undefined
  ): Promise<{ size: number; chunkFilePath: string }> {
    const chunkFilePath = path.join(fileDirPath, `chunk-${chunkIndex}`);
    const tempPath = chunkFilePath + '.part';

    if (existsSync(chunkFilePath)) {
      throw new Error(`Chunk already exists: ${chunkFilePath}`);
    }

    const hasher = new Blake3Hasher();
    let size = 0;

    await pipeline(
      stream,
      new Transform({
        transform(chunk, _, cb) {
          hasher.update(chunk);
          size += chunk.length;
          cb(null, chunk);
        },
      }),
      createWriteStream(tempPath)
    );

    const actualChecksum = hasher.digest('hex');

    if (checksum && checksum !== actualChecksum) {
      rmSync(tempPath); // Clean up temp file if checksum mismatch
      throw new Error(`Checksum mismatch: expected ${checksum}, got ${actualChecksum}`);
    }

    // chunk size validation with 10% tolerance
    if (neededChunkSize && size > neededChunkSize * 0.9) {
      rmSync(tempPath);
      throw new Error(`Chunk size mismatch: expected ${neededChunkSize}, got ${size}`);
    }

    await fsPromises.rename(tempPath, chunkFilePath);

    return {
      size,
      chunkFilePath: path.relative(this.filesDir, chunkFilePath),
    };
  }
}
