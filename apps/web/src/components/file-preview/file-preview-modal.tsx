'use client';

import { useEffect, useState } from 'react';
import { ClientRegistry, FileEntry } from '@agam-space/client';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ArrowDownToLine, Info, X } from 'lucide-react';
import { FilePreview } from '@/components/file-preview/file-preview';
import { useDownloadStore } from '@/store/download-store';
import { toast } from 'sonner';

type Props = {
  file: FileEntry | null;
  onClose: () => void;
};

export function FilePreviewModal({ file, onClose }: Props) {
  const [showFileInfo, setShowFileInfo] = useState(false);

  // Reset info panel when preview is closed
  useEffect(() => {
    if (!file) {
      setShowFileInfo(false);
    }
  }, [file]);

  if (!file) return null;

  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className='w-screen h-screen max-w-none p-0 overflow-hidden [&>button.absolute]:hidden bg-transparent border-0 rounded-none flex flex-col'
      >
        <VisuallyHidden>
          <DialogTitle>{file.name ?? 'Preview file'}</DialogTitle>
        </VisuallyHidden>

        {/* Toolbar at the very top - fixed */}
        <div className='flex items-center justify-between px-6 py-3 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <DialogClose asChild>
              <button
                className='rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                aria-label='Close'
              >
                <X className='w-5 h-5' />
              </button>
            </DialogClose>
            <h2 className='text-base font-semibold truncate text-white drop-shadow-sm'>
              {file.name}
            </h2>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setShowFileInfo(!showFileInfo)}
              className='rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
              aria-label='Toggle file info'
            >
              <Info className='w-5 h-5' />
            </button>
            <button
              onClick={() => {
                try {
                  const item = ClientRegistry.getDownloadManager().enqueue(file);
                  useDownloadStore.getState().addDownload({
                    id: item.id,
                    fileName: file.name,
                    totalBytes: file.size,
                    downloadedBytes: 0,
                    progress: 0,
                    status: 'pending',
                  });
                } catch (err) {
                  console.error(err);
                  toast.error('Download failed');
                }
              }}
              className='rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
              aria-label='Download file'
            >
              <ArrowDownToLine className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Preview content - fills remaining height */}
        <div className='relative flex-1 flex items-center justify-center overflow-hidden'>
          <div
            className={`w-full h-full flex items-center justify-center overflow-auto transition-all duration-300 ${
              showFileInfo ? 'pr-80' : 'pr-0'
            }`}
          >
            <FilePreview fileEntry={file} onClose={onClose} />
          </div>

          {/* Info side panel - absolute positioned, slides in from right */}
          <div
            className={`absolute top-0 right-0 h-full w-80 transition-transform duration-300 ease-in-out ${
              showFileInfo ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className='h-full m-4 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden'>
              <div className='p-6 pb-8 space-y-6'>
                <h3 className='text-lg font-semibold text-white border-b border-white/10 pb-3'>
                  File Details
                </h3>

                <div className='space-y-4'>
                  <div>
                    <label className='text-xs text-white/60 uppercase tracking-wide'>Name</label>
                    <p className='text-sm text-white/90 mt-1 break-words'>{file.name}</p>
                  </div>

                  <div>
                    <label className='text-xs text-white/60 uppercase tracking-wide'>Type</label>
                    <p className='text-sm text-white/90 mt-1'>{file.mime || 'Unknown'}</p>
                  </div>

                  <div>
                    <label className='text-xs text-white/60 uppercase tracking-wide'>Size</label>
                    <p className='text-sm text-white/90 mt-1'>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      <span className='text-white/60 text-xs ml-2'>
                        ({file.size.toLocaleString()} bytes)
                      </span>
                    </p>
                  </div>

                  {file.createdAt && (
                    <div>
                      <label className='text-xs text-white/60 uppercase tracking-wide'>
                        Created
                      </label>
                      <p className='text-sm text-white/90 mt-1'>
                        {new Date(file.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {file.updatedAt && (
                    <div>
                      <label className='text-xs text-white/60 uppercase tracking-wide'>
                        Modified
                      </label>
                      <p className='text-sm text-white/90 mt-1'>
                        {new Date(file.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className='text-xs text-white/60 uppercase tracking-wide'>File ID</label>
                    <p className='text-white/60 mt-1 text-xs font-mono break-all'>{file.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
