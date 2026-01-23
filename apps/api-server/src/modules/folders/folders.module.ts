import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '@/database';
import { AuthModule } from '../auth/auth.module';

import { FolderContentController } from './folder-content.controller';
import { FolderContentService } from './folder-content.service';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { FilesModule } from '@/modules/files/files.module';
import { PublicShareModule } from '@/modules/public-share/public-share.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    forwardRef(() => FilesModule),
    forwardRef(() => PublicShareModule),
  ],
  controllers: [FoldersController, FolderContentController],
  providers: [FoldersService, FolderContentService],
  exports: [FoldersService, FolderContentService],
})
export class FoldersModule {}
