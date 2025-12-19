'use client'

import { toast } from 'sonner'
import { ClientRegistry, FileEntry } from '@agam-space/client';
import { useDownloadStore } from '@/store/download-store';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine } from 'lucide-react';

type Props = {
  fileEntry: FileEntry
}

export function DownloadAction({ fileEntry }: Props) {
  const handleDownload = () => {
    try {
      const item = ClientRegistry.getDownloadManager().enqueue(fileEntry)
      useDownloadStore.getState().addDownload({
        id: item.id,
        fileName: fileEntry.name,
        totalBytes: fileEntry.size,
        downloadedBytes: 0,
        progress: 0,
        status: 'pending',
      })
    } catch (err) {
      console.error(err)
      toast.error('Download failed')
    }
  }

  return (
    <Button
      onClick={handleDownload}
      variant="default"
      size="sm"
      className="w-auto justify-start"
    >
      <ArrowDownToLine className="w-4 h-4 mr-2" />
      Download file
    </Button>
  )
}
