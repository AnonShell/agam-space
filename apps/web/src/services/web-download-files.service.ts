import { ClientRegistry, FileEntry } from '@agam-space/client';
import { useDownloadStore } from '@/store/download-store';
import { toast } from 'sonner';

export const WebDownloadFilesService = {
  enqueueFilesForDownload(selectedFiles: FileEntry[]) {
    for (const fileEntry of selectedFiles) {
      try {
        const item = ClientRegistry.getDownloadManager().enqueue(fileEntry);

        useDownloadStore.getState().addDownload({
          id: item.id,
          fileName: fileEntry.name,
          totalBytes: fileEntry.size,
          downloadedBytes: 0,
          progress: 0,
          status: 'pending',
        });
      } catch (err) {
        console.error(`Download failed for ${fileEntry.name}`, err);
        toast.error(`Download failed for ${fileEntry.name}`);
      }
    }
  },
};
