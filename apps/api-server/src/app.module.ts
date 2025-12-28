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

@Module({
  imports: [
    // Configuration module (global)
    AppConfigModule,

    // Database module (global)
    DatabaseModule,

    ScheduleModule.forRoot(),

    // // Rate limiting module
    // ThrottlerModule.forRoot([
    //   {
    //     name: 'short',
    //     ttl: 30_000, // 30 seconds
    //     limit: 100, // 100 requests per minute
    //   },
    // ]),

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
  ],
  providers: [
    // Global rate limiting guard
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
