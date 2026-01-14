import { useEventBusListener } from '@/hooks/use-event-bus-listener';
import { AppEvent } from '@/lib/event-bus';
import { useExplorerRefreshStore } from '@/store/explorer-refresh-store';
import { logger } from '@/lib/logger';

export function GlobalEventListeners() {
  useEventBusListener(AppEvent.CONTENT_RESTORED, ({ parentId }) => {
    logger.debug('[GlobalEventListeners]', 'CONTENT_RESTORED event received:', { parentId });

    const folderKey = parentId || 'root';
    useExplorerRefreshStore.getState().triggerRefreshForFolder(folderKey);

    logger.debug('[GlobalEventListeners]', ` Triggered refresh for folder: ${folderKey}`);
  });

  return null; // This component doesn't render anything
}
