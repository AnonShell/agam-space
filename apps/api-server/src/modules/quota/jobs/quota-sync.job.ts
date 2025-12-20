import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AbstractScheduledJob } from '@/common/base.jobs';
import { QuotaSyncService } from '@/modules/quota/quota-sync.service';

@Injectable()
export class QuotaSyncJob extends AbstractScheduledJob {
  protected readonly intervalMinutes = 5;
  protected readonly enabled = true;
  protected readonly jobName = 'quota-sync-job';

  constructor(
    schedulerRegistry: SchedulerRegistry,
    private readonly quotaSyncService: QuotaSyncService
  ) {
    super(schedulerRegistry);
  }

  protected async run(): Promise<void> {
    await this.quotaSyncService.syncAllUserQuotas();
  }
}
