import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from '@/database';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';
import { FoldersModule } from './modules/folders/folders.module';
import { E2eeKeysModule } from '@/modules/user-key/e2ee-keys.module';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ServerInfoModule } from '@/modules/server-info/server-info.module';
import { TrashModule } from './modules/trash/trash.module';
import { SsoModule } from '@/modules/sso/sso.module';
import { UserQuotaModule } from '@/modules/quota/quota.module';
import { TrustedDevicesModule } from '@/modules/trusted-devices/trusted-devices.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { PublicShareModule } from './modules/public-share/public-share.module';

@Module({
  imports: [
    // Configuration module (global)
    AppConfigModule,

    // Database module (global)
    DatabaseModule,

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 100,
        },
      ],
      skipIf: () => false,
    }),

    // Feature modules
    ServerInfoModule,
    SsoModule,
    AuthModule,
    E2eeKeysModule,
    FilesModule,
    FoldersModule,
    TrashModule,
    UserQuotaModule,
    TrustedDevicesModule,
    PublicShareModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
