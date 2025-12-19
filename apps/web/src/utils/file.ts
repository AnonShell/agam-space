export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000_000) {
    return `${(bytes / 1_000_000_000_000).toFixed(1)} TB`;
  } else if (bytes >= 1_000_000_000) {
    return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  } else if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  } else if (bytes >= 1_000) {
    return `${(bytes / 1_000).toFixed(1)} KB`;
  } else {
    return `${bytes} B`;
  }
}
