import { toast } from 'sonner';
import { ContentEntry, FileEntry, getFolderInfo, moveFiles, moveFolders } from '@agam-space/client';

export const ExplorerPageService = {
  async handleMove(
    entries: ContentEntry[],
    selectedTargetId: string | null,
    currentFolderId: string | null
  ) {
    if (entries.every(e => e.parentId === selectedTargetId)) {
      toast.info('Items are already in this folder.');
      return;
    }

    if (!selectedTargetId) return;
    if (await this.isDescendant(selectedTargetId, entries)) {
      toast.error('Cannot move a folder into itself or its subfolder.');
      return;
    }

    console.log('Moving entries:', entries.length, 'to folder:', selectedTargetId);

    const [folderResult, fileResult] = await Promise.all([
      moveFolders(
        entries.filter(e => e.isFolder),
        currentFolderId ?? null,
        selectedTargetId
      ),
      moveFiles(
        entries.filter(e => !e.isFolder) as FileEntry[],
        currentFolderId ?? null,
        selectedTargetId
      ),
    ]);

    const updated: ContentEntry[] = [...folderResult.updated, ...fileResult.updated];
    if (updated.length > 0) {
      toast.success(`Moved ${updated.length} item(s) successfully.`);
      // onClose();
    }

    const failed = [...folderResult.failed, ...fileResult.failed];
    if (folderResult.failed.length > 0) {
      toast.error(`Failed to move ${failed.length} item(s)`);
    }

    return updated;
  },

  async isDescendant(targetId: string, entries: ContentEntry[]): Promise<boolean> {
    const selectedFolderIds = new Set(entries.filter(e => e.isFolder).map(e => e.id));

    if (selectedFolderIds.has(targetId)) return true;

    // Traverse upwards
    let currentId: string | null = targetId;
    while (currentId) {
      const folder = await getFolderInfo(currentId);
      currentId = folder?.parentId ?? null;
      if (currentId && selectedFolderIds.has(currentId)) return true;
    }

    return false;
  },
};
