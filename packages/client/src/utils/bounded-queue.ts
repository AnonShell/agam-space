export class BoundedQueue<T> {
  private queue: T[] = [];
  private resolvers: ((value: T | null) => void)[] = [];
  private waiters: (() => void)[] = [];
  private done = false;

  constructor(private capacity: number) {}

  async push(item: T): Promise<void> {
    if (this.done) throw new Error('Cannot push after done');

    if (this.queue.length >= this.capacity) {
      await new Promise<void>(resolve => this.waiters.push(resolve));
    }

    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve(item); // immediately pass to waiting pop()
    } else {
      this.queue.push(item); // buffer
    }
  }

  async pop(): Promise<T | null> {
    if (this.queue.length > 0) {
      const item = this.queue.shift()!;
      if (this.waiters.length > 0) {
        const waiter = this.waiters.shift()!;
        waiter(); // allow one pending push to proceed
      }
      return item;
    }

    if (this.done) return null; // signal no more items will come

    return new Promise<T | null>(resolve => this.resolvers.push(resolve));
  }

  signalPushComplete() {
    this.done = true;
    for (const resolve of this.resolvers) {
      resolve(null); // tell all waiting pop()s that it's over
    }
    this.resolvers = [];
  }
}
