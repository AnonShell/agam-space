'use client'

import { useEffect, useState } from 'react'
import { decryptAndMergeFileChunks, FileEntry, getPreviewCache, setPreviewCache } from '@agam-space/client';
import { DownloadAction } from '@/components/download/download-action';
import { FilePreviewCoordinator } from '@/components/file-preview/file-preview-coordinator';
import { PreviewLoading } from '@/components/file-preview/preview-loading';
import { UnsupportedPreview } from '@/components/file-preview/unsupported-file-preview';

type Props = {
  fileEntry: FileEntry
}

const MAX_PREVIEW_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

export function FilePreview({ fileEntry }: Props) {
  const [fileData, setFileData] = useState<Uint8Array | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (fileEntry.size > MAX_PREVIEW_SIZE_BYTES) return

    let cancelled = false

    const cached = getPreviewCache(fileEntry.id)
    if (cached) {
      setFileData(cached)
      return
    }

    ;(async () => {
      try {
        const bytes = await decryptAndMergeFileChunks({
          fileId: fileEntry.id,
          totalChunks: fileEntry.chunkCount,
        })
        if (!cancelled) {
          setFileData(bytes)
          setPreviewCache(fileEntry.id, bytes)
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('Failed to load or decrypt file.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fileEntry.size, fileEntry.id, fileEntry.chunkCount])

  // const fileEntry = {
  //   id: fileId,
  //   name: originalFilename,
  //   size: sizeInBytes,
  //   mimeType,
  //   totalChunks,
  //   fileKey,
  //   fetchChunk,
  // }

  if (fileEntry.size > MAX_PREVIEW_SIZE_BYTES) {
    return <UnsupportedPreview fileEntry={fileEntry} />
  }

  if (error) return <div className="text-red-500">{error}</div>
  if (!fileData) {
    return <PreviewLoading />
  }

  return (
    <div className="space-y-2">
      <FilePreviewCoordinator
        data={fileData}
        fileEntry={fileEntry}
      />
    </div>
  )
}
