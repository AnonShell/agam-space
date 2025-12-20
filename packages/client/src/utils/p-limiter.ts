type Task<T> = {
  fn: (...args: unknown[]) => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  args: unknown[];
};

export interface LimitFunction {
  <T>(fn: (...args: unknown[]) => Promise<T>, ...args: unknown[]): Promise<T>;
  activeCount(): number;
  pendingCount(): number;
}

export function pLimiter(concurrency: number): LimitFunction {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new TypeError('Expected `concurrency` to be an integer ≥ 1');
  }

  let activeCount = 0;
  const queue: Task<any>[] = [];

  const next = () => {
    if (activeCount >= concurrency || queue.length === 0) return;

    const { fn, resolve, reject, args } = queue.shift()!;
    activeCount++;

    void (async () => {
      try {
        const result = await fn(...args);
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        activeCount--;
        process.nextTick(next);
      }
    })();
  };

  const limit = <T>(fn: (...args: unknown[]) => Promise<T>, ...args: unknown[]): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const task: Task<T> = { fn, resolve, reject, args };
      queue.push(task as Task<any>); // safe cast — used immediately in `next()`
      process.nextTick(next);
    });
  };

  limit.activeCount = (): number => activeCount;
  limit.pendingCount = (): number => queue.length;

  return limit;
}
