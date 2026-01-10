'use client';

import { ChangeEvent } from 'react';
import { UploadManager } from '@agam-space/client';
import { useUploadStore } from '@/store/upload-store';
import { BrowserFileReader } from '@/lib/browser-file-reader';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  uploadManager: UploadManager;
  parentFolderId: string | null;
}

export function FileUploadButton({ uploadManager, parentFolderId }: FileUploadProps) {
  const addUpload = useUploadStore(s => s.addUpload);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    Array.from(e.target.files).forEach(file => {
      const reader = new BrowserFileReader(file);
      const metadata = reader.getMetadata();

      const item = uploadManager.enqueue(reader, parentFolderId);

      if (!item) {
        // Shouldn't happen anymore, but handle gracefully
        return;
      }

      addUpload({
        id: item.id,
        fileName: metadata.name,
        parentFolderId,
        status: item.status,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: metadata.size,
        error: item.error,
      });
    });

    e.target.value = ''; // allow same file reselect
  };

  return (
    <Button variant='ghost' size='icon' asChild title='Upload files'>
      <label className='cursor-pointer'>
        <Upload className='w-5 h-5' />
        <input type='file' multiple hidden onChange={handleFileChange} />
      </label>
    </Button>
  );
}
