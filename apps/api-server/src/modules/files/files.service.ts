import { ConflictException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, isNull, not, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION, type FileEntity, files, NewFile } from '@/database';
import { StorageService } from '../storage/storage.service';
import { FileChunkService } from './file-chunk.service';
import { FileUploadStatusDto } from '@/modules/files/dto/upload.dto';
import { FoldersService, isFolderIdRoot } from '@/modules/folders/folders.service';
import { AppConfigService } from '@/config/config.service';
import { CreateFile, File, FileSchema, UpdateFile } from '@agam-space/shared-types';
import { FileDto, isValidFolderAndNotRoot } from '@/modules/folders/dto/folder-content.dto';
import { QuotaService } from '@/modules/quota/quota.service';
import { DrizzleTransaction } from '@/database/database.providers';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>,
    private readonly storageService: StorageService,
    private readonly fileChunkService: FileChunkService,
    @Inject(forwardRef(() => FoldersService))
    private readonly foldersService: FoldersService,
    private readonly appConfigService: AppConfigService,

    @Inject(forwardRef(() => QuotaService))
    private readonly quotaService: QuotaService,
  ) {
  }

  async getFilesUnderParent(
    userId: string,
    parentFolderId?: string,
    includeTrashed: boolean = false,
  ): Promise<FileEntity[]> {
    const baseConditions = [
      eq(files.userId, userId),
      parentFolderId ? eq(files.parentId, parentFolderId) : isNull(files.parentId),
    ];

    const excludeStatuses = ['pending', 'deleted'];
    if (!includeTrashed) {
      excludeStatuses.push('trashed');
    }

    baseConditions.push(not(inArray(files.status, excludeStatuses)));

    return (await this.db
      .select()
      .from(files)
      .where(and(...baseConditions))) as FileEntity[];
  }

  async createFile(userId: string, data: CreateFile): Promise<FileDto> {
    const parentId = isFolderIdRoot(data.parentId) ? null : data.parentId;

    // Check for duplicate name at same level
    const hasExisting = await this.hasFileWithNameHash(userId, parentId, data.nameHash);
    if (hasExisting) {
      throw new ConflictException('A file with this name already exists at this level');
    }

    this.logger.log(`📄 Creating file for user: ${userId}`);

    try {
      const newFile: NewFile = {
        ...data,
        parentId,
        userId,
        status: 'pending',
        approxSize: 0,
      };
      const [createdFile] = await this.db.insert(files).values(newFile).returning();

      return FileSchema.parse(createdFile);
    } catch (error) {
      this.logger.error(`Failed to create file for user ${userId}:`, error);
      throw error;
    }
  }

  async markFileAsComplete(userId: string, fileId: string): Promise<FileDto> {
    const file = await this.getFileEntity(userId, fileId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.status !== 'pending') {
      throw new ConflictException(`File is status ${file.status} cannot be completed`);
    }

    const chunks = await this.fileChunkService.getFileChunks(fileId);
    const approxSize = chunks.reduce((acc, chunk) => acc + chunk.approxSize, 0);

    if (chunks.length !== file.chunkCount) {
      throw new ConflictException(
        `Not all chunks have been uploaded, got ${chunks.length}/${file.chunkCount}`,
      );
    }

    if (approxSize > this.appConfigService.getConfig().files.maxFileSize) {
      // mark file as deleted
      await this.markFilesAsDeleted([file.id]);
      throw new ConflictException(
        `File size exceeds maximum limit of ${this.appConfigService.getConfig().files.maxFileSize} bytes`,
      );
    }

    const updatedFileEntity = await this.db.transaction(async (tx) => {

      const updatedQuota = await this.quotaService.incrementUsedStorage(userId, approxSize, tx);
      if (updatedQuota === null) {
        throw new ConflictException('User storage quota exceeded');
      }

      const updatedFile = await this.updateFileProps(fileId,
        { status: 'complete', approxSize },
        tx);

      if (!updatedFile) {
        throw new Error('Failed to update file status');
      }

      return updatedFile;
    });

    return FileSchema.parse(updatedFileEntity);
  }

  /**
   * Get file by ID
   */
  async getFile(userId: string, fileId: string): Promise<FileDto> {
    const file = await this.getFileEntity(userId, fileId);
    return FileSchema.parse(file);
  }

  async getFileEntity(userId: string, fileId: string): Promise<FileEntity> {
    const [file] = await this.db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  private async updateFileProps(
    fileId: string,
    props: Partial<FileEntity>,
    tx?: DrizzleTransaction,
  ): Promise<FileEntity | null> {
    const [updatedFile] = await (tx ?? this.db)
      .update(files)
      .set(props)
      .where(eq(files.id, fileId))
      .returning();

    return updatedFile ?? null;
  }

  /**
   * Check if file exists with given name at same level
   */
  async hasFileWithNameHash(
    userId: string,
    parentFolderId: string | null,
    nameHash: string,
  ): Promise<string | null> {
    const result = await this.db
      .select({ id: files.id })
      .from(files)
      .where(
        and(
          eq(files.userId, userId),
          isValidFolderAndNotRoot(parentFolderId) ? eq(files.parentId, parentFolderId) : isNull(files.parentId),
          eq(files.nameHash, nameHash),
          not(inArray(files.status, ['deleted', 'trashed'])),
        ),
      )
      .limit(1);

    console.log('Checking file existence:', { userId, parentFolderId, nameHash, result });
    return result.length > 0 ? result[0].id : null;
  }

  async ensureFileDirectory(userId: string, fileId: string): Promise<string> {
    return this.storageService.ensureFileDirectory(userId, fileId);
  }

  async updateFile(userId: string, fileId: string, data: UpdateFile): Promise<File> {
    const file = await this.getFile(userId, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const updates: Partial<FileEntity> = {};

    if (data.parentId) {
      // Check if the new parent folder exists
      const parentFolder = await this.foldersService.getFolder(userId, data.parentId);
      if (!parentFolder) {
        throw new NotFoundException('Target folder not found');
      }

      if (!data.fkWrapped) {
        throw new ConflictException('Cannot move file without providing a wrapped file key');
      }

      updates.parentId = data.parentId;
      updates.fkWrapped = data.fkWrapped;
    }

    if (data.nameHash) {
      // Check for duplicate name at same level
      const hasExisting = await this.hasFileWithNameHash(
        userId,
        updates.parentId || file.parentId,
        data.nameHash,
      );
      if (hasExisting) {
        throw new ConflictException('A file with this name already exists at this level');
      }
      updates.nameHash = data.nameHash;

      if (!data.metadataEncrypted) {
        throw new ConflictException('Cannot update file name without providing encrypted metadata');
      }
    }

    if (data.metadataEncrypted) {
      updates.metadataEncrypted = data.metadataEncrypted;
    }

    const [updatedFile] = await this.db
      .update(files)
      .set(updates)
      .where(eq(files.id, fileId))
      .returning();

    if (!updatedFile) {
      throw new Error('Failed to update file');
    }

    this.logger.log(`File ${fileId} updated by user ${userId}`);

    return FileSchema.parse(updatedFile);
  }

  async trashFiles(userId: string, fileIds: string[]): Promise<string[] | null> {
    if (fileIds.length === 0) {
      return null;
    }

    const updatedIds = await this.db
      .update(files)
      .set({ status: 'trashed' })
      .where(
        and(
          eq(files.userId, userId),
          inArray(files.id, fileIds),
          not(inArray(files.status, ['trashed', 'deleted'])),
        ),
      )
      .returning({ id: files.id });

    const updatedIdsSet = new Set(updatedIds.map(file => file.id));
    return fileIds
      .filter(id => !updatedIdsSet.has(id))
      .map(id => {
        this.logger.warn(`File ${id} could not be trashed by user ${userId}`);
        return id;
      });
  }

  async trashFile(userId: string, fileId: string) {
    const file = await this.getFileEntity(userId, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.status === 'trashed') {
      return;
    }

    if (file.status !== 'complete') {
      throw new ConflictException(`File is status ${file.status} cannot be trashed`);
    }

    const [updatedFile] = await this.db
      .update(files)
      .set({ status: 'trashed' })
      .where(eq(files.id, fileId))
      .returning();

    if (!updatedFile) {
      throw new Error('Failed to update file status to trashed');
    }

    this.logger.log(`File ${fileId} marked as trashed by user ${userId}`);
  }

  async restoreFile(userId: string, fileId: string): Promise<FileEntity> {
    const file = await this.getFileEntity(userId, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.status !== 'trashed') {
      throw new ConflictException(`File is status ${file.status} cannot be restored`);
    }

    const [updatedFile] = await this.db
      .update(files)
      .set({ status: 'complete' })
      .where(eq(files.id, fileId))
      .returning();

    if (!updatedFile) {
      throw new Error('Failed to restore file');
    }

    this.logger.log(`File ${fileId} restored by user ${userId}`);
    return updatedFile;
  }

  async deleteFile(userId: string, fileId: string, force: boolean = false): Promise<void> {
    const file = await this.getFileEntity(userId, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.status !== 'trashed') {
      throw new ConflictException(`File is status ${file.status} cannot be deleted`);
    }

    await this.cleanupFile(userId, file);
  }

  async cleanupFile(userId: string, file: FileEntity): Promise<boolean> {
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.status !== 'deleted') {
      throw new ConflictException(`File is status ${file.status} cannot be cleaned up`);
    }

    return this.db.transaction(async (tx) => {

      await this.fileChunkService.deleteFileChunks(file.userId, file.id);

      await this.quotaService.decrementUsedStorage(file.userId, file.approxSize, tx);

      // delete file record
      const result = await (tx ?? this.db)
        .delete(files)
        .where(and(eq(files.id, file.id), eq(files.userId, file.userId)))
        .returning();

      if (result.length === 0) {
        return false;
      }

      this.logger.log(`File ${file.id} cleaned up by user ${userId}`);
      return true;
    });
  }

  async fileUploadStatus(userId: string, fileId: string): Promise<FileUploadStatusDto> {
    const file = await this.getFileEntity(userId, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const chunkIndexes = await this.fileChunkService.getFileChunkIndexes(fileId);

    return {
      status: file.status,
      uploadedChunks: chunkIndexes,
    };
  }

  async markAllTrashedFilesAsDeleted(userId: string): Promise<
    {
      id: string;
      parentId?: string;
    }[]
  > {
    this.logger.log(`Marking all trashed files as deleted for user ${userId}`);

    const result = await this.db
      .update(files)
      .set({ status: 'deleted' })
      .where(and(eq(files.userId, userId), eq(files.status, 'trashed')))
      .returning({ id: files.id, parentId: files.parentId });

    if (result.length === 0) {
      return [];
    }

    return result;
  }

  async cleanupDeletedAndTrashedFiles() {
    this.logger.log('Cleaning up deleted and trashed files');

    const filesToCleanup = await this.db
      .select()
      .from(files)
      .where(
        and(
          eq(files.status, 'deleted'),
          // trashed should have updatedAt older than 30 days
          or(eq(files.status, 'trashed')),
        ),
      );

    if (filesToCleanup.length === 0) {
      this.logger.log('No files to clean up');
      return;
    }

    for (const file of filesToCleanup) {
      try {
        await this.cleanupFile(file.userId, file);
      } catch (error) {
        this.logger.error(`Failed to clean up file ${file.id}:`, error);
      }
    }

    this.logger.log('Cleanup completed');
  }

  async cleanupDeletedFiles(batchSize: number = 1000): Promise<number> {
    this.logger.log('Cleaning up deleted files');

    const filesToCleanup = await this.db
      .select()
      .from(files)
      .where(eq(files.status, 'deleted'))
      .limit(batchSize);

    if (filesToCleanup.length === 0) {
      this.logger.log('No files to clean up');
      return 0;
    }

    for (const file of filesToCleanup) {
      try {
        await this.cleanupFile(file.userId, file);
      } catch (error) {
        this.logger.error(`Failed to clean up file ${file.id}:`, error);
      }
    }

    this.logger.log('Cleanup completed');
    return filesToCleanup.length;
  }

  async markFilesAsDeleted(fileIds: string[]) {
    if (fileIds.length === 0) {
      return [];
    }

    this.logger.log(`Marking ${fileIds.length} files as deleted`);

    await this.db
      .update(files)
      .set({ status: 'deleted' })
      .where(and(inArray(files.id, fileIds), not(inArray(files.status, ['deleted', 'trashed']))));
  }

  async getFilesInFolder(folderId: string) {
    const result = await this.db
      .select({ id: files.id })
      .from(files)
      .where(eq(files.parentId, folderId));

    return result.map(file => file.id);
  }

  checkFileNameHashExists(userId: string, parentId: string, nameHash: string): Promise<string | null> {
    return this.hasFileWithNameHash(userId, parentId, nameHash);
  }

}
