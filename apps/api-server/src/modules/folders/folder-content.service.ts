import { Inject, Injectable, Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION } from '@/database';

import { FolderContentsDto } from './dto/folder-content.dto';
import { FoldersService } from './folders.service';
import { FileSchema, FolderSchema } from '@agam-space/shared-types';
import { FilesService } from '../files/files.service';

@Injectable()
export class FolderContentService {
  private readonly logger = new Logger(FolderContentService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>,
    private readonly foldersService: FoldersService,
    private readonly filesService: FilesService
  ) {}

  /**
   * Get all contents (files and folders) at root level or in a specific folder
   */
  async getContents(userId: string, parentId?: string): Promise<FolderContentsDto> {
    if (parentId) {
      const folder = await this.foldersService.getFolder(userId, parentId);
      if (!folder) {
        throw new Error('Parent folder not found');
      }

      if (folder.status !== 'active') {
        return { folders: [], files: [] };
      }
    }

    const [folderList, fileList] = await Promise.all([
      this.foldersService.getFoldersUnderParent(userId, parentId),
      this.filesService.getFilesUnderParent(userId, parentId),
    ]);

    return {
      folders: folderList.map(folder => FolderSchema.parse(folder)),
      files: fileList.map(file => FileSchema.parse(file)),
    };
  }
}
