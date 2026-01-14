import { useEffect, useRef } from 'react';
import { eventBus, type EventMap } from '@/lib/event-bus';

/**
 * React hook for subscribing to event bus events
 * Automatically cleans up subscription on unmount
 *
 * @example
 * useEventBusListener(AppEvent.FILES_RESTORED, ({ parentId }) => {
 *   if (parentId === currentFolderId) {
 *     refreshFolderContents();
 *   }
 * });
 */
export function useEventBusListener<K extends keyof EventMap>(
  event: K,
  callback: (data: EventMap[K]) => void
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return eventBus.on(event, data => callbackRef.current(data));
  }, [event]);
}

/**
 * Alternative hook if you want to listen to multiple events
 *
 * @example
 * useEventBusListeners({
 *   [AppEvent.FILES_RESTORED]: ({ parentId }) => { },
 *   [AppEvent.FILES_TRASHED]: ({ itemIds }) => { },
 * });
 */
export function useEventBusListeners<K extends keyof EventMap>(
  listeners: Partial<Record<K, (data: EventMap[K]) => void>>
): void {
  const listenersRef = useRef(listeners);

  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    Object.entries(listenersRef.current).forEach(([event, callback]) => {
      if (callback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedCallback = callback as (data: any) => void;
        unsubscribers.push(eventBus.on(event as K, typedCallback));
      }
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);
}
