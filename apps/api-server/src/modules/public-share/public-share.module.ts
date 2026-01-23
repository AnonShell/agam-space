import { forwardRef, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PublicShareService } from './public-share.service';
import { PublicShareController } from './public-share.controller';
import { PublicShareAccessController } from './public-share-access.controller';
import { PublicShareAccessGuard } from './public-share-access.guard';
import { DatabaseModule } from '@/database';
import { AuthModule } from '../auth/auth.module';
import { FoldersModule } from '@/modules/folders/folders.module';
import { FilesModule } from '@/modules/files/files.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    forwardRef(() => FoldersModule),
    forwardRef(() => FilesModule),
    CacheModule.register({
      ttl: 15 * 60 * 1000, // 15 mins
      max: 1000,
    }),
  ],
  providers: [
    PublicShareService,
    PublicShareAccessGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [PublicShareController, PublicShareAccessController],
  exports: [PublicShareService],
})
export class PublicShareModule {}
