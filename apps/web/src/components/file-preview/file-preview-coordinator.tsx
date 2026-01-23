'use client';

import dynamic from 'next/dynamic';
import { FileEntry } from '@agam-space/client';
import { detectLanguage, isImage, isPdf, isText } from '@/utils/mime-helper';
import { ImagePreview } from '@/components/file-preview/image-preview';
import { UnsupportedPreview } from '@/components/file-preview/unsupported-file-preview';
import { TextFileEditor } from './text-editor';

// Dynamic import to avoid build-time issues with react-pdf and DOMMatrix
const PdfViewer = dynamic(() => import('./pdf-viewer').then(mod => ({ default: mod.PdfViewer })), {
  ssr: false,
  loading: () => <div className='flex items-center justify-center h-full'>Loading PDF...</div>,
});

type Props = {
  fileEntry: FileEntry;
  data: Uint8Array;
  onClose?: () => void;
};

export function FilePreviewCoordinator({ fileEntry, data, onClose }: Props) {
  if (isImage(fileEntry.mime)) {
    return <ImagePreview data={data} fileEntry={fileEntry} />;
  }

  if (isText(fileEntry.mime, fileEntry.name)) {
    const text = new TextDecoder().decode(data);
    const language = detectLanguage(fileEntry.name);
    return (
      <TextFileEditor
        content={text}
        language={language}
        fileId={fileEntry.id}
        fileName={fileEntry.name}
        onSave={async () => {
          //TODO: implement save functionality
        }}
      />
    );
  }

  if (isPdf(fileEntry.mime)) {
    return <PdfViewer data={data} />;
  }
  //
  // if (isVideo(mimeType)) {
  //   return <VideoPreview data={fileData} mimeType={mimeType} />
  // }

  return <UnsupportedPreview fileEntry={fileEntry} onClose={onClose} />;
}
