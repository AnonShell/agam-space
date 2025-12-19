'use client';

import { useEffect, useState } from 'react';
import { FileEntry } from '@agam-space/client';

type Props = {
  fileEntry: FileEntry
  data: Uint8Array
}

export function ImagePreview({ fileEntry, data }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([data as BlobPart], { type: fileEntry.mime }));
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [data, fileEntry.mime]);

  if (!blobUrl) return null;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={blobUrl}
        alt={fileEntry.name}
        loading="lazy"
        className="max-h-[80vh] max-w-full rounded shadow object-contain"
      />
    </div>
  );
}