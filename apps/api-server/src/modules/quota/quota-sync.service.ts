import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION, files, userQuotaDBSchema } from '@/database';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, inArray, not, sql } from 'drizzle-orm';
import { QuotaService } from '@/modules/quota/quota.service';

@Injectable()
export class QuotaSyncService {
  private readonly logger = new Logger(QuotaSyncService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>,
    private readonly quotaService: QuotaService
  ) {}

  async syncAllUserQuotas() {
    const quotas = await this.db.select().from(userQuotaDBSchema);
    if (!quotas || quotas.length === 0) {
      this.logger.debug('No user quotas found to sync');
      return;
    }

    const promises = quotas.map(quota => this.syncUserQuotas(quota.userId));
    await Promise.all(promises);
  }

  private async syncUserQuotas(userId: string) {
    const totalSize = await this.calculateUserStorageUsed(userId);
    await this.quotaService.resetUsedStorage(userId, totalSize);
    this.logger.debug(`Synced quota for user ${userId}: ${totalSize}`);
  }

  private async calculateUserStorageUsed(userId: string): Promise<number> {
    const [totalSize] = await this.db
      .select({ totalSize: sql<number>`sum(${files.approxSize})` })
      .from(files)
      .where(and(eq(files.userId, userId), not(inArray(files.status, ['pending', 'deleted']))))
      .limit(1);

    return totalSize?.totalSize || 0;
  }
}
