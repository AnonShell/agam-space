export function logMem(label: string) {
  const m = process.memoryUsage();
  console.log(
    `[${label}] Heap: ${(m.heapUsed / 1024 / 1024).toFixed(1)} MB, RSS: ${(m.rss / 1024 / 1024).toFixed(1)} MB`
  );
}
