import { BrowserFileReader } from '@/lib/browser-file-reader';
import { ClientRegistry, createNewFolder } from '@agam-space/client';
import { useUploadStore } from '@/store/upload-store';

export const WebUploadService = {
  async uploadFilesInFolder(filesMap: Map<string, File[]>, currentFolderId: string) {
    console.log('Starting upload process for files in folder:', currentFolderId, filesMap);

    const createdFolders = new Map<string, string>();
    createdFolders.set('', currentFolderId);

    // Step 1: Sort folder paths from shallow to deep
    const sortedPaths = [...filesMap.keys()].sort(
      (a, b) => a.split('/').length - b.split('/').length
    );

    console.log(sortedPaths);

    for (const fullPath of sortedPaths) {
      const files = filesMap.get(fullPath);
      if (!files || files.length === 0) continue;

      if (!fullPath || fullPath.trim().length === 0) {
        this.enqueueFilesForUpload(files, currentFolderId);
        continue;
      }

      const segments = fullPath.split('/').filter(Boolean);
      let parentPath = '';
      let parentId = currentFolderId;

      for (const segment of segments) {
        const currentPath = parentPath ? `${parentPath}/${segment}` : segment;

        if (!createdFolders.has(currentPath)) {
          const newFolder = await createNewFolder(segment.trim(), parentId);
          createdFolders.set(currentPath, newFolder.id);
          parentId = newFolder.id;
          console.log(`Created folder: ${currentPath} with ID: ${newFolder.id}`);
        } else {
          parentId = createdFolders.get(currentPath)!;
        }

        parentPath = currentPath;
      }

      this.enqueueFilesForUpload(files, parentId);
    }
  },

  enqueueFilesForUpload(files: File[], folderId: string) {
    if (!files || files.length === 0) return;
    console.log(`Enqueuing ${files.length} files for upload to folder ID: ${folderId}`);

    files.forEach(file => {
      const reader = new BrowserFileReader(file);
      const metadata = reader.getMetadata();

      const item = ClientRegistry.getUploadManager().enqueue(reader, folderId);

      if (!item) {
        // Shouldn't happen anymore, but handle gracefully
        return;
      }

      useUploadStore.getState().addUpload({
        id: item.id,
        fileName: metadata.name,
        parentFolderId: folderId,
        status: item.status,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: metadata.size,
        error: item.error,
      });
    });
  },
};
