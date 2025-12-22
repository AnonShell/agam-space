import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { aliasedTable, and, eq, inArray, isNull, not, notExists, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION } from '../../database/database.providers';
import { FolderEntity, folders, NewFolderEntity } from '../../database/schema';

import { CreateFolderDto, FolderDto, UpdateFolderDto } from './dto/folder-content.dto';
import { Folder, FolderSchema } from '@agam-space/shared-types';
import { FilesService } from '@/modules/files/files.service';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService
  ) {}

  async getFoldersUnderParent(
    userId: string,
    parentId?: string,
    includeTrashed: boolean = false
  ): Promise<FolderEntity[]> {
    const baseConditions = [
      eq(folders.userId, userId),
      parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId),
    ];

    const excludeStatuses = ['pending', 'deleted'];
    if (!includeTrashed) {
      excludeStatuses.push('trashed');
    }

    baseConditions.push(not(inArray(folders.status, excludeStatuses)));

    const result: FolderEntity[] = (await this.db
      .select()
      .from(folders)
      .where(and(...baseConditions))) as FolderEntity[];

    return result;
  }

  async getFolder(userId: string, folderId: string): Promise<FolderDto> {
    const [folder] = await this.db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return FolderSchema.parse(folder);
  }

  async createFolder(userId: string, data: CreateFolderDto, tx?: any): Promise<FolderDto> {
    const dbInstance = tx || this.db;

    data.parentId = isFolderIdRoot(data.parentId) ? null : data.parentId;

    // Check for duplicate name at same level
    const hasExisting = await this.hasFolderWithName(userId, data.nameHash, data.parentId);

    if (hasExisting) {
      throw new ConflictException('A folder with this name already exists at this level');
    }

    this.logger.log(`📁 Creating folder for user: ${userId}`);

    const newFolder: NewFolderEntity = {
      ...data,
      userId,
    };

    try {
      const [createdFolder] = await dbInstance.insert(folders).values(newFolder).returning();
      return FolderSchema.parse(createdFolder);
    } catch (error) {
      this.logger.error(`Failed to create folder for user ${userId}:`, error);
      throw error;
    }
  }

  async hasFolderWithName(userId: string, nameHash: string, parentId?: string): Promise<boolean> {
    const result = await this.db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.userId, userId),
          parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId),
          eq(folders.nameHash, nameHash),
          not(inArray(folders.status, ['deleted', 'trashed']))
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async patchFolder(
    userId: string,
    folderId: string,
    updates: Partial<UpdateFolderDto>
  ): Promise<FolderDto> {
    this.logger.log(`📁 Patching folder ${folderId} for user ${userId}`, updates);

    const existingFolder = await this.getFolder(userId, folderId);
    if (!existingFolder || existingFolder.status !== 'active') {
      throw new NotFoundException('Folder not found');
    }

    const allowedUpdates: Partial<FolderEntity> = {};

    if (updates.parentId) {
      if (!updates.fkWrapped) {
        throw new BadRequestException('fkWrapped is required when updating parentId');
      }

      const parentFolder = await this.getFolder(userId, updates.parentId);
      if (!parentFolder) {
        throw new NotFoundException('Target parent folder not found');
      }

      allowedUpdates.parentId = updates.parentId;
      allowedUpdates.fkWrapped = updates.fkWrapped;
    }

    const folderWithName = await this.hasFolderWithName(
      userId,
      updates.nameHash || existingFolder.nameHash,
      updates.parentId || existingFolder.parentId
    );
    if (folderWithName) {
      throw new ConflictException('A folder with this name already exists at this level');
    }

    if (updates.nameHash) {
      allowedUpdates.nameHash = updates.nameHash;
      if (!updates.metadataEncrypted) {
        throw new BadRequestException('metadataEncrypted is required when updating nameHash');
      }
    }

    if (updates.metadataEncrypted) {
      allowedUpdates.metadataEncrypted = updates.metadataEncrypted;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    console.log(`Updating folder ${folderId} for user ${userId} with data:`, allowedUpdates);

    const [updatedFolder] = await this.db
      .update(folders)
      .set(allowedUpdates)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .returning();

    if (!updatedFolder) {
      throw new Error('Error updating folder');
    }

    this.logger.log(`Folder ${folderId} updated successfully By user ${userId}`);
    return FolderSchema.parse(updatedFolder);
  }

  async trashFolders(userId: string, folderIds: string[]): Promise<string[] | null> {
    if (!Array.isArray(folderIds)) {
      throw new BadRequestException('Invalid folder IDs array');
    }

    if (folderIds.length === 0) {
      return null;
    }

    const updatedIds = await this.db
      .update(folders)
      .set({ status: 'trashed' })
      .where(
        and(
          eq(folders.userId, userId),
          inArray(folders.id, folderIds),
          not(inArray(folders.status, ['trashed', 'deleted']))
        )
      )
      .returning({ id: folders.id });

    // compare the result with the input folderIds for failed IDs
    const updatedIdsSet = new Set(updatedIds.map(item => item.id));
    return folderIds
      .filter(id => !updatedIdsSet.has(id))
      .map(id => {
        this.logger.warn(`Folder ${id} could not be trashed by user ${userId}`);
        return id;
      });
  }

  async deleteFolder(userId: string, folderId: string, force: boolean = false): Promise<void> {
    this.logger.log(`📁 Deleting folder ${folderId} by user ${userId}`);

    const result = await this.db
      .update(folders)
      .set({ status: force ? 'deleted' : 'trashed' })
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Folder not found or already deleted');
    }

    this.logger.log(`Folder ${folderId} deleted successfully for user ${userId}`);
  }

  async restoreFolder(userId: string, folderId: string) {
    this.logger.log(`📁 Restoring folder ${folderId} for user ${userId}`);

    const folder = await this.getFolder(userId, folderId);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.status !== 'trashed') {
      throw new BadRequestException('Folder is not in trash');
    }

    const result = await this.db
      .update(folders)
      .set({ status: 'active' })
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Error restoring folder');
    }
  }

  async markAllTrashedFoldersAsDeleted(userId: string): Promise<
    {
      id: string;
      parentId?: string;
    }[]
  > {
    this.logger.log(`Marking all trashed folders as deleted for user ${userId}`);

    const result = await this.db
      .update(folders)
      .set({ status: 'deleted' })
      .where(and(eq(folders.userId, userId), eq(folders.status, 'trashed')))
      .returning({
        id: folders.id,
        parentId: folders.parentId,
      });

    if (result.length === 0) {
      this.logger.debug(`No trashed folders found for user ${userId}`);
    } else {
      this.logger.log(`Marked ${result.length} trashed folders as deleted for user ${userId}`);
    }

    return result;
  }

  async getFolderRootsIdsWithStatus(status: 'active' | 'trashed' | 'deleted'): Promise<string[]> {
    const parent = aliasedTable(folders, 'parent');

    const deletedRoots = await this.db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.status, status),
          or(
            isNull(folders.parentId),
            notExists(
              this.db
                .select()
                .from(parent)
                .where(and(eq(parent.id, folders.parentId), eq(parent.status, status)))
            )
          )
        )
      );

    return deletedRoots.map(folder => folder.id);
  }

  async getFolderChildrenIds(folderId: string): Promise<string[]> {
    const children = await this.db
      .select({ id: folders.id })
      .from(folders)
      .where(eq(folders.parentId, folderId));

    return children.map(child => child.id);
  }

  async hardDeleteFolders(folderIds: string[]) {
    if (!folderIds || folderIds.length == 0) {
      return;
    }

    this.logger.log(`Hard deleting folders: ${folderIds.join(', ')}`);

    await this.db.delete(folders).where(inArray(folders.id, folderIds));
  }

  async getFolderAncestors(
    userId: string,
    folderId: string,
    depthCount: number
  ): Promise<Folder[]> {
    const result = await this.db.execute<FolderEntity>(sql`
      WITH RECURSIVE folder_path AS (
        SELECT *, 1 AS depth
        FROM folders
        WHERE id = ${folderId} AND ${folders.userId} = ${userId}
    
        UNION ALL
    
        SELECT f.*, fp.depth + 1
        FROM folders f
        JOIN folder_path fp ON f.id = fp.parent_id
      )
      SELECT *
      FROM folder_path
      ORDER BY depth ASC
      LIMIT ${depthCount ?? 10};
    `);

    return result.map(folder => {
      return FolderSchema.parse({
        id: folder[folders.id.name],
        nameHash: folder[folders.nameHash.name],
        parentId: folder[folders.parentId.name],
        metadataEncrypted: folder[folders.metadataEncrypted.name],
        fkWrapped: folder[folders.fkWrapped.name],
        userId: folder[folders.userId.name],
        status: folder[folders.status.name],
        createdAt: new Date(folder[folders.createdAt.name] as string | Date).toISOString(),
        updatedAt: new Date(folder[folders.updatedAt.name] as string | Date).toISOString(),
      });
    });
  }

  async computeFolderSize(userId: string, folderId: string) {
    await this.getFolder(userId, folderId);
    const size = await this.filesService.computeFolderSize(folderId);

    //saving
    await this.db
      .update(folders)
      .set({ size: size })
      .where(and(eq(folders.id, folderId)));

    return size;
  }
}

export function isFolderIdRoot(folderId: string | null | undefined): boolean {
  return folderId && folderId.toLowerCase().trim() === 'root';
}
