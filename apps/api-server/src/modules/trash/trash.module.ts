import { Module } from '@nestjs/common';
import { FilesModule } from '@/modules/files/files.module';
import { FoldersModule } from '@/modules/folders/folders.module';
import { TrashService } from './trash.service';
import { TrashController } from './trash.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { TrashCleanupJob } from '@/modules/trash/job/trash-cleanup.job';

@Module({
  imports: [AuthModule, FilesModule, FoldersModule],
  controllers: [TrashController],
  providers: [TrashService, TrashCleanupJob],
  exports: [TrashService],
})
export class TrashModule {}
