'use client';

import { FileEntry } from '@agam-space/client';
import { DownloadAction } from '@/components/download/download-action';

type Props = {
  fileEntry: FileEntry
}

export function UnsupportedPreview({ fileEntry }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center h-80 text-center space-y-4 border rounded-md border-dashed p-6">
      <p className="text-muted-foreground text-sm">
        Preview not available for this file type.
      </p>
      {/*<DownloadAction fileEntry={fileEntry} />*/}
    </div>
  );
}
