import type { IncomingMessage } from 'http';

export function cleanupRequestStream(req: IncomingMessage) {
  // Prevent memory leaks by clearing listeners and destroying the socket
  try {
    req.removeAllListeners();
    if (!req.destroyed) {
      req.destroy();
    }
  } catch (err) {
    // Optional: log or ignore
    console.warn('Failed to clean up request stream:', err);
  }
}
