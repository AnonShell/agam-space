import { UpdateFile, UserFileMetadata } from '@agam-space/shared-types';
import { FileEntry } from '../content-tree.store';
import { blake3HashWithEncoding, EncryptedEnvelopeCodec, toUtf8Bytes } from '@agam-space/core';
import { EncryptionRegistry } from '../encryption/encryption-strategy';
import { getDecryptedFileKeyById } from './file-decrypt';
import { updateFileApi } from '../api';
import { getDecryptedFolderKey } from '../folder/folder-contents';
import { ClientRegistry } from '../init/client.registry';

export function hashFileName(name: string): string {
  return blake3HashWithEncoding(name.trim(), 'hex');
}

export async function encryptFileMetadata(
  metadata: UserFileMetadata,
  fileKey: Uint8Array
): Promise<string> {
  const metadataBytes = toUtf8Bytes(JSON.stringify(metadata));
  const envelope = await EncryptionRegistry.get().encrypt(metadataBytes, fileKey);
  return EncryptedEnvelopeCodec.serialize(envelope);
}

export async function renameFile(file: FileEntry, newName: string): Promise<FileEntry> {
  const fileKey = await getDecryptedFileKeyById(file.id);

  const updatedMetadata: UserFileMetadata = {
    ...file.metadata!,
    name: newName,
  };

  const newNameHash = hashFileName(newName);
  const metadataEncrypted = await encryptFileMetadata(updatedMetadata, fileKey);

  const updates: UpdateFile = {
    nameHash: newNameHash,
    metadataEncrypted,
  };

  const updatedFile = await updateFileApi(file.id, updates);
  console.log(`File ${file.id} renamed to ${newName}`);

  return {
    ...file,
    name: newName,
    updatedAt: new Date(updatedFile.updatedAt),
    metadata: updatedMetadata,
  };
}

export async function moveFiles(
  files: FileEntry[],
  currentFolderId: string | null,
  targetFolderId: string | null
): Promise<{
  updated: FileEntry[];
  failed: { id: string; error: string }[];
}> {
  if (files.length === 0)
    return {
      updated: [],
      failed: [],
    };

  const parentFolderKey = await getDecryptedFolderKey(targetFolderId);

  const updated: FileEntry[] = [];
  const failed: { id: string; error: string }[] = [];

  const results = await Promise.allSettled(
    files.map(async file => {
      const fileKey = await getDecryptedFileKeyById(file.id);

      const newEncryptedKeyEnvelope = await EncryptionRegistry.get().encrypt(
        fileKey,
        parentFolderKey
      );
      const newEncryptedKey = EncryptedEnvelopeCodec.serialize(newEncryptedKeyEnvelope);

      const updateFile: UpdateFile = {
        parentId: targetFolderId,
        fkWrapped: newEncryptedKey,
      };

      const updatedFile = await updateFileApi(file.id, updateFile);
      ClientRegistry.getKeyManager().setFileKey(file.id, fileKey);

      const newFileEntry = {
        ...file,
        parentId: targetFolderId || undefined,
        updatedAt: new Date(updatedFile.updatedAt),
      };

      return {
        file: newFileEntry,
        updatedFile,
      };
    })
  );

  results.forEach((res, idx) => {
    const fileId = files[idx].id;
    if (res.status === 'fulfilled') {
      updated.push({
        ...res.value.file,
        parentId: targetFolderId!,
        updatedAt: new Date(res.value.updatedFile.updatedAt),
      });
    } else {
      console.error(`Failed to move file ${fileId}:`, res.reason);
      failed.push({
        id: fileId,
        error: res.reason instanceof Error ? res.reason.message : String(res.reason),
      });
    }
  });

  ClientRegistry.getContentTreeManager().store.evictFolderData(currentFolderId || 'root');
  ClientRegistry.getContentTreeManager().store.evictFolderData(targetFolderId || 'root');

  return {
    updated,
    failed,
  };
}
