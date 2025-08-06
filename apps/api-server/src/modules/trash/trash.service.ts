import { Inject, Injectable, Logger } from '@nestjs/common';
import { FoldersService } from '@/modules/folders/folders.service';
import { FilesService } from '@/modules/files/files.service';
import { DATABASE_CONNECTION, FileEntity, files, FolderEntity, folders } from '@/database';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { File, Folder, TrashedItems } from '@agam-space/shared-types';

@Injectable()
export class TrashService {
  private readonly logger: Logger = new Logger(TrashService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>,
    private readonly foldersService: FoldersService,
    private readonly filesService: FilesService
  ) {}

  async emptyTrash(userId: string) {
    const [folders, files] = await Promise.all([
      this.foldersService.markAllTrashedFoldersAsDeleted(userId),
      this.filesService.markAllTrashedFilesAsDeleted(userId),
    ]);

    // trigger async cleanup of deleted contents
    this.cleanupDeletedContents().then();

    return folders.length + files.length;
  }

  async cleanupDeletedContents() {
    await this.markAllFolderContentsAsDeleted();

    await this.cleanupDeletedFiles();
  }

  async markAllFolderContentsAsDeleted(): Promise<void> {
    const deletedFolderRoots = await this.foldersService.getFolderRootsIdsWithStatus('deleted');

    for (const folderId of deletedFolderRoots) {
      this.logger.log(`marking contents of folder ${folderId} as deleted`);

      const { folderIds, fileIds } = await this.collectDescendantFoldersAndFiles(folderId);

      // Mark all descendant files as deleted
      await this.filesService.markFilesAsDeleted(fileIds);

      // Mark all descendant folders as deleted
      if (folderIds.length > 0) {
        await this.foldersService.hardDeleteFolders(folderIds);
      }
    }
  }

  async collectDescendantFoldersAndFiles(rootId: string): Promise<{
    folderIds: string[];
    fileIds: string[];
  }> {
    const folderQueue = [rootId];
    const folderIds: string[] = [];
    const fileIds: string[] = [];

    while (folderQueue.length > 0) {
      const folderId = folderQueue.shift()!;
      folderIds.push(folderId);

      const childrenIds = await this.foldersService.getFolderChildrenIds(folderId);
      folderQueue.push(...childrenIds);

      const filesInFolder = await this.filesService.getFilesInFolder(folderId);
      fileIds.push(...filesInFolder);
    }

    return { folderIds, fileIds };
  }

  private async cleanupDeletedFiles() {
    let totalDeleted = 0;
    const batchSize = 1000;

    while (true) {
      const deletedCount = await this.filesService.cleanupDeletedFiles(batchSize);
      totalDeleted += deletedCount;

      if (deletedCount === 0) break;
    }

    if (totalDeleted > 0) {
      this.logger.log(`Deleted ${totalDeleted} files marked as status='deleted'`);
    }
  }

  async getTrashedItems(userId: string): Promise<TrashedItems> {
    const [folders, files] = await Promise.all([
      this.getTopLevelTrashedFolders(userId),
      this.getTopLevelTrashedFiles(userId),
    ]);

    return {
      folders,
      files,
    };
  }

  private async getTopLevelTrashedFolders(userId: string): Promise<Folder[]> {
    const result = await this.db.execute<FolderEntity>(sql`
  WITH RECURSIVE trashed_folders AS (
    SELECT id, parent_id
    FROM folders
    WHERE status = 'trashed' AND user_id = ${userId}

    UNION ALL

    SELECT f.id, f.parent_id
    FROM folders f
    INNER JOIN trashed_folders tf ON f.parent_id = tf.id
    WHERE f.user_id = ${userId}
  )
  SELECT
    'folder' AS type,
    id,
    parent_id,
    metadata_encrypted,
    name_hash,
    fk_wrapped,
    created_at,
    updated_at,
    status
  FROM folders
  WHERE status = 'trashed'
    AND user_id = ${userId}
    AND id NOT IN (
      SELECT f.id
      FROM folders f
      JOIN trashed_folders tf ON f.parent_id = tf.id
    );
`);

    return result.map(folderRow => ({
      id: folderRow.id,
      parentId: folderRow[folders.parentId.name],
      metadataEncrypted: folderRow[folders.metadataEncrypted.name],
      nameHash: folderRow[folders.nameHash.name],
      fkWrapped: folderRow[folders.fkWrapped.name],
      createdAt: folderRow[folders.createdAt.name],
      updatedAt: folderRow[folders.updatedAt.name],
      status: 'trashed',
    }));
  }

  private async getTopLevelTrashedFiles(userId: string): Promise<File[]> {
    const fileSelectSql = Object.values(files)
      .map(col => `files.${col.name}`)
      .join(', ');

    // 2. Trashed files whose parent is not trashed

    const filesResult = await this.db.execute<FileEntity>(
      sql.raw(`
      SELECT ${fileSelectSql}
      FROM files
      LEFT JOIN folders ON files.parent_id = folders.id
      WHERE files.status = 'trashed'
        AND files.user_id = '${userId}'
        AND (folders.status IS NULL OR folders.status != 'trashed');
    `)
    );

    return filesResult.map(fileRow => ({
      id: fileRow.id as string,
      userId: fileRow[files.userId.name] as string,
      parentId: fileRow[files.parentId.name] as string | null,
      metadataEncrypted: fileRow[files.metadataEncrypted.name] as string,
      nameHash: fileRow[files.nameHash.name] as string,
      fkWrapped: fileRow[files.fkWrapped.name] as string,
      createdAt: fileRow[files.createdAt.name] as string,
      updatedAt: fileRow[files.updatedAt.name] as string,
      chunkCount: fileRow[files.chunkCount.name] as number,
      approxSize: fileRow[files.approxSize.name] as number,
      status: 'trashed',
    }));
  }
}
