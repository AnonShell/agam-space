'use client';

import { FileEntry } from '@agam-space/client';
import { detectLanguage, isImage, isPdf, isText } from '@/utils/mime-helper';
import { ImagePreview } from '@/components/file-preview/image-preview';
import { UnsupportedPreview } from '@/components/file-preview/unsupported-file-preview';
import { PdfViewer } from '@/components/file-preview/pdf-viewer';
import { TextFileEditor } from './text-editor';

type Props = {
  fileEntry: FileEntry
  data: Uint8Array
}

export function FilePreviewCoordinator({ fileEntry, data }: Props) {

  console.log('fileEntry', fileEntry);
  if (isImage(fileEntry.mime)) {
    return <ImagePreview data={data} fileEntry={fileEntry} />;
  }

  if (isText(fileEntry.mime, fileEntry.name)) {
    const text = new TextDecoder().decode(data)
    const language = detectLanguage(fileEntry.name)
    return (
      <TextFileEditor
        content={text}
        language={language}
        fileId={fileEntry.id}
        fileName={fileEntry.name}
        onSave={async (updated) => {
          const updatedBytes = new TextEncoder().encode(updated)
          // const encryptedChunks = await encryptIntoChunks(updatedBytes, encryptionKey)
          // await uploadChunks(fileId, encryptedChunks)
          console.log('saving updated text', { fileId: fileEntry.id, updatedBytes, fileEntryName: fileEntry.name });
        }}
      />
    )
  }

  if (isPdf(fileEntry.mime)) {
    return <PdfViewer data={data} />;
  }
  //
  // if (isVideo(mimeType)) {
  //   return <VideoPreview data={fileData} mimeType={mimeType} />
  // }

  return <UnsupportedPreview fileEntry={fileEntry} />;
}
