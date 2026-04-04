import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { SsoService } from './sso.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 5 * 60 * 1000,
      max: 10_000,
    }),
  ],
  providers: [SsoService],
  exports: [SsoService],
})
export class SsoModule {}
