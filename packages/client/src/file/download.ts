import { fetchFileChunkApi } from '../api';
import { FileEntry } from '../content-tree.store';
import { decryptFileChunks, getDecryptedFileKeyById } from './file-decrypt';
import { writeFileStreamToBlob } from './write-file-to-blob';
import { writeFileStreamToFs } from './download/write-file-to-fs';

const SIZE_THRESHOLD = 50 * 1024 * 1024; // 50MB
const MAX_BLOB_FALLBACK = 200 * 1024 * 1024;

export async function downloadFile(
  fileEntry: FileEntry,
  onChunkDownloaded?: (chunkIndex: number, bytes: number) => void
): Promise<void> {
  const isLarge = fileEntry.size >= SIZE_THRESHOLD;
  const isChromium = 'showSaveFilePicker' in window;

  console.log(
    `Downloading file: ${fileEntry.name}, size: ${fileEntry.size}, isLarge: ${isLarge}, isChromium: ${isChromium}`
  );

  const fetchChunk = async (fileId: string, index: number): Promise<Uint8Array> => {
    const chunk = await fetchFileChunkApi(fileId, index);
    onChunkDownloaded?.(index, chunk.length);
    return chunk;
  };

  const fileKey = await getDecryptedFileKeyById(fileEntry.id);
  const chunkStream = decryptFileChunks({
    fileId: fileEntry.id,
    fileKey,
    totalChunks: fileEntry.chunkCount,
    fetchChunk,
  });

  if (!isLarge) {
    console.log(`File ${fileEntry.name} is small enough, writing to Blob...`);
    return writeFileStreamToBlob(fileEntry.name, chunkStream);
  }

  if (isChromium) {
    return await writeFileStreamToFs(fileEntry.name, chunkStream);
  }
  //
  // if (fileEntry.size <= MAX_BLOB_FALLBACK) {
  //   return await writeFileStreamToBlob(fileEntry.name, chunkStream);
  // }

  throw new Error('Downloading large files is only supported on Chromium browsers.');
}

export async function decryptAndMergeFileChunks(params: {
  fileId: string;
  totalChunks: number;
}): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  const fileKey = await getDecryptedFileKeyById(params.fileId);

  const fetchChunk = async (fileId: string, index: number): Promise<Uint8Array> => {
    return await fetchFileChunkApi(fileId, index);
  };

  for await (const chunk of decryptFileChunks({
    ...params,
    fileKey: fileKey,
    fetchChunk,
  })) {
    chunks.push(chunk);
    totalLength += chunk.length;
  }

  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}
