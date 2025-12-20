import { Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

export abstract class AbstractScheduledJob implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name);
  protected abstract readonly intervalMinutes: number;
  protected abstract readonly enabled: boolean;
  protected abstract readonly jobName: string;

  private isRunning = false;

  protected constructor(protected readonly schedulerRegistry: SchedulerRegistry) {}

  onModuleInit() {
    if (!this.enabled) {
      this.logger.debug(`${this.jobName} is disabled.`);
      return;
    }

    this.logger.log(`Scheduling ${this.jobName} every ${this.intervalMinutes} minutes.`);
    this.schedulerRegistry.addInterval(
      this.jobName,
      setInterval(() => this._runSafely(), this.intervalMinutes * 60 * 1000)
    );
  }

  private async _runSafely() {
    if (this.isRunning) {
      this.logger.warn(`${this.jobName} is already running, skipping.`);
      return;
    }

    this.isRunning = true;
    try {
      this.logger.debug(`Running ${this.jobName}...`);
      await this.run();
      this.logger.debug(`${this.jobName} completed.`);
    } catch (err) {
      this.logger.error(`Error in ${this.jobName}:`, err);
    } finally {
      this.isRunning = false;
    }
  }

  protected abstract run(): Promise<void>;
}
