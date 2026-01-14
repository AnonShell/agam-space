import { logger } from '../logger';
import { AppEvent } from './app-events.enum';
import type {
  ContentRestoredPayload,
  FilesTrashedPayload,
  FolderDeletedPayload,
  QuotaChangedPayload,
} from './event-types';

export type EventMap = {
  [AppEvent.CONTENT_RESTORED]: ContentRestoredPayload;
  [AppEvent.FILES_TRASHED]: FilesTrashedPayload;
  [AppEvent.FOLDER_DELETED]: FolderDeletedPayload;
  [AppEvent.QUOTA_CHANGED]: QuotaChangedPayload;
};

type Listener<K extends keyof EventMap> = (data: EventMap[K]) => void;

class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners = new Map<keyof EventMap, Set<Listener<any>>>();

  /**
   * Subscribe to an event
   * Returns cleanup function - no need to manually unsubscribe
   */
  on<K extends keyof EventMap>(event: K, callback: Listener<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const set = this.listeners.get(event);
    if (!set) {
      throw new Error(`Failed to get listeners for event: ${String(event)}`);
    }

    set.add(callback);
    logger.debug(
      'EventBus',
      `Subscribed to event "${String(event)}", total listeners: ${set.size}`
    );

    return () => {
      set.delete(callback);
      logger.debug(
        'EventBus',
        `Unsubscribed from event "${String(event)}", remaining listeners: ${set.size}`
      );
    };
  }

  /**
   * Emit an event to all listeners
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const listeners = this.listeners.get(event);
    logger.debug(
      'EventBus',
      `Emitting event "${String(event)}" to ${listeners?.size ?? 0} listener(s)`,
      data
    );
    listeners?.forEach(cb => cb(data));
  }

  /**
   * Clear all listeners for an event (useful for testing)
   */
  clear<K extends keyof EventMap>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const eventBus = new EventBus();
