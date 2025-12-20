'use client';

import { ReactNode, useCallback, useState } from 'react';
import { groupFilesByFolder, readAllFileSystemEntries } from '@/lib/file-system-entry-reader';

interface Props {
  onDropFiles: (files: Map<string, File[]>) => void;
  children: ReactNode;
}

export function FileDropZone({ onDropFiles, children }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);


    (async () => {
      const files = await readAllFileSystemEntries(e.dataTransfer);
      if (files.length === 0) return;
      console.log('Final files:', files.map(f => f.webkitRelativePath));

      const grouped = groupFilesByFolder(files);
      console.log('Grouped map:', grouped);

      onDropFiles(grouped)
    })()

  }, [onDropFiles]);

  const prevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onDragOver={(e) => {
        prevent(e);
        setDragging(true);
      }}
      onDragLeave={(e) => {
        prevent(e);
        setDragging(false);
      }}
      onDrop={handleDrop}
      className="relative w-full h-full"
    >
      {children}

      {dragging && (
        <div className="absolute inset-0 z-50 bg-muted/40 border-2 border-dashed border-primary rounded-md flex items-center justify-center pointer-events-none transition-all duration-200">
          <span className="text-sm text-muted-foreground">Drop files to upload</span>
        </div>
      )}
    </div>
  );
}
