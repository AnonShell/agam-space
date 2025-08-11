import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '@/database';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';

import { FileChunkService } from '@/modules/files/file-chunk.service';
import { FileChunksController } from '@/modules/files/file-chunks.controller';
import { FoldersModule } from '@/modules/folders/folders.module';
import { UserQuotaModule } from '@/modules/quota/quota.module';
import { PendingFilesCleanupJob } from '@/modules/files/jobs/pending-files-cleanup.job';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    AuthModule,
    FoldersModule,
    forwardRef(() => UserQuotaModule)
  ],
  controllers: [FilesController, FileChunksController],
  providers: [FilesService, FileChunkService, PendingFilesCleanupJob],
  exports: [FilesService, FileChunkService],
})
export class FilesModule {}
