import { AuthModule } from '@/modules/auth/auth.module';
import { FilesModule } from '@/modules/files/files.module';
import { UserQuotaController } from '@/modules/quota/quota.controller';
import { QuotaService } from '@/modules/quota/quota.service';
import { forwardRef, Module } from '@nestjs/common';
import { QuotaSyncJob } from './jobs/quota-sync.job';
import { QuotaSyncService } from '@/modules/quota/quota-sync.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UserQuotaController],
  providers: [QuotaService, QuotaSyncJob, QuotaSyncService],
  exports: [QuotaService],
})
export class UserQuotaModule {}
