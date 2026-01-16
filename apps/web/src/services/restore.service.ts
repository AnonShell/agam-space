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
    movedToRoot?: boolean;
  }> {
    const { finalName, finalParentId, restoreItem, hasConflict, movedToRoot } =
      await RestoreConflictService.handleRestoreWithConflict(
        itemName,
        parentId,
        isFolder,
        itemId,
        existingItem
      );

    if (isFolder) {
      await restoreFolderApi(itemId, restoreItem);
    } else {
      await restoreFileApi(itemId, restoreItem);
    }

    eventBus.emit(AppEvent.CONTENT_RESTORED, {
      itemId,
      parentId: finalParentId,
      itemType: isFolder ? 'folder' : 'file',
    });

    return { success: true, finalName, hasConflict, movedToRoot };
  }

  static async emptyTrash(emptyTrashApi: () => Promise<{ deletedCount: number }>): Promise<void> {
    const { deletedCount } = await emptyTrashApi();
    toast.success(
      deletedCount > 0
        ? `Permanently deleted ${deletedCount} item(s) from Trash.`
        : 'Trash is already empty.'
    );
    useUserQuotaStore.getState().refresh();
  }
}
