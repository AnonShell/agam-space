import { EncryptWorkerClient } from '@/lib/workers/encrypt-worker-client';

export class WebWorkerPool {
  private readonly max: number;
  private active = 0;
  private queue: (() => void)[] = [];

  constructor(
    private readonly workerUrl: URL,
    maxWorkers = 4
  ) {
    this.max = maxWorkers;
  }

  run<T>(task: (worker: EncryptWorkerClient) => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const exec = async () => {
        if (this.active >= this.max) {
          this.queue.push(() => this.run(task).then(resolve).catch(reject));
          return;
        }

        this.active++;
        const worker = new EncryptWorkerClient(this.workerUrl);

        try {
          const result = await task(worker);
          resolve(result);
        } catch (e) {
          reject(e);
        } finally {
          worker.destroy();
          this.active--;
          const next = this.queue.shift();
          next?.();
        }
      };

      exec();
    });
  }
}
