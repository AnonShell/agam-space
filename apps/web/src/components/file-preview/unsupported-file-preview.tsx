'use client';

import { FileEntry, ClientRegistry } from '@agam-space/client';
import { FileX, ArrowDownToLine } from 'lucide-react';
import { toast } from 'sonner';
import { useDownloadStore } from '@/store/download-store';

type Props = {
  fileEntry: FileEntry;
  onClose?: () => void;
};

export function UnsupportedPreview({ fileEntry, onClose }: Props) {
  const handleDownload = () => {
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
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 border rounded-lg border-dashed border-white/20 p-8 bg-white/5'>
      <div className='rounded-full bg-white/10 p-4'>
        <FileX className='w-12 h-12 text-white/60' />
      </div>
      <div>
        <p className='text-white/90 font-medium'>Preview not available for this file type</p>
        <p className='text-sm text-white/60 mt-1'>Download the file to view it</p>
      </div>
      <button
        onClick={handleDownload}
        className='mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2'
      >
        <ArrowDownToLine className='w-4 h-4' />
        Download File
      </button>
    </div>
  );
}
