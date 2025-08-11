import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AbstractScheduledJob } from '@/common/base.jobs';
import { FilesService } from '@/modules/files/files.service';

@Injectable()
export class PendingFilesCleanupJob extends AbstractScheduledJob {
  protected readonly intervalMinutes = 5;
  protected readonly enabled = true;
  protected readonly jobName = 'pending-files-cleanup-job';

  constructor(
    schedulerRegistry: SchedulerRegistry,
    private readonly filesService: FilesService,
  ) {
    super(schedulerRegistry);
  }

  protected async run(): Promise<void> {
    await this.filesService.cleanupFilesInStatus('pending', 1000, 5 * 60);
  }
}
