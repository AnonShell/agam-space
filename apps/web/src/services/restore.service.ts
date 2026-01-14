import { restoreFileApi, restoreFolderApi } from '@agam-space/client';
import { toast } from 'sonner';
import { eventBus, AppEvent } from '@/lib/event-bus';
import { RestoreConflictService } from './restore-conflict.service';
import { useUserQuotaStore } from '@/store/user-quota.store';
import type { FileEntry, FolderEntry } from '@agam-space/client';

export interface RestoreItemParams {
  itemId: string;
  isFolder: boolean;
  itemName: string;
  parentId: string | null;
  existingItem: FileEntry | FolderEntry;
}

export class RestoreService {
  static async restoreItem({
    itemId,
    isFolder,
    itemName,
    parentId,
    existingItem,
  }: RestoreItemParams): Promise<{
    success: boolean;
    finalName: string;
    hasConflict: boolean;
  }> {
    const { finalName, renameData, hasConflict } =
      await RestoreConflictService.handleRestoreWithConflict(
        itemName,
        parentId,
        isFolder,
        itemId,
        existingItem
      );

    if (isFolder) {
      await restoreFolderApi(itemId, renameData ? renameData : undefined);
    } else {
      await restoreFileApi(itemId, renameData ? renameData : undefined);
    }

    eventBus.emit(AppEvent.CONTENT_RESTORED, {
      itemId,
      parentId,
      itemType: isFolder ? 'folder' : 'file',
    });
    return { success: true, finalName, hasConflict };
  }

  /**
   * Empty all items from trash
   */
  static async emptyTrash(emptyTrashApi: () => Promise<{ deletedCount: number }>): Promise<void> {
    const { deletedCount } = await emptyTrashApi();
    toast.success(
      deletedCount > 0
        ? `Permanently deleted ${deletedCount} item(s) from Trash.`
        : 'Trash is already empty.'
    );
    // Refresh user quota
    useUserQuotaStore.getState().refresh();
  }
}
