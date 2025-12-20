import { FolderEntry } from '../content-tree.store';
import { FolderMetadata, UpdateFolder } from '@agam-space/shared-types';
import { getDecryptedFolderKey, getFolderInfo } from './folder-contents';
import { blake3HashWithEncoding, EncryptedEnvelopeCodec, toUtf8Bytes } from '@agam-space/core';
import { EncryptionRegistry } from '../encryption/encryption-strategy';
import { patchFolderApi } from '../api';
import { ClientRegistry } from '../init/client.registry';

export async function renameFolder(folder: FolderEntry, newName: string): Promise<FolderEntry> {
  const folderKey = await getDecryptedFolderKey(folder.id);

  const updatedMetadata: FolderMetadata = {
    ...folder.metadata!,
    name: newName.trim(),
  };

  const nameHash = hashFolderName(updatedMetadata.name);
  const metadataEncrypted = await encryptFolderMetadata(updatedMetadata, folderKey);

  const updateFolder: UpdateFolder = {
    nameHash,
    metadataEncrypted,
  };

  const updatedFolder = await patchFolderApi(folder.id, updateFolder);

  console.log(`Folder ${folder.id} renamed to ${newName}`);

  return {
    ...folder,
    name: newName,
    updatedAt: new Date(updatedFolder.updatedAt),
    metadata: updatedMetadata,
  };
}

export async function moveFolders(
  folders: FolderEntry[],
  currentFolderId: string | null,
  targetFolderId: string | null
): Promise<{
  updated: FolderEntry[];
  failed: { id: string; error: string }[];
}> {
  if (!folders || folders.length === 0)
    return {
      updated: [],
      failed: [],
    };

  const parentFolderKey = await getDecryptedFolderKey(targetFolderId);

  const updatedFolders: FolderEntry[] = [];
  const failedFolders: { id: string; error: string }[] = [];

  const results = await Promise.allSettled(
    folders.map(async folder => {
      const folderKey = await getDecryptedFolderKey(folder.id);

      const newEncryptedKeyEnvelope = await EncryptionRegistry.get().encrypt(
        folderKey,
        parentFolderKey
      );
      const newEncryptedKey = EncryptedEnvelopeCodec.serialize(newEncryptedKeyEnvelope);

      const updateFolder: UpdateFolder = {
        parentId: targetFolderId,
        fkWrapped: newEncryptedKey,
      };

      const updatedFolder = await patchFolderApi(folder.id, updateFolder);
      ClientRegistry.getKeyManager().setFolderKey(folder.id, folderKey);

      ClientRegistry.getContentTreeManager().store.evictFolderData(folder.id);

      return {
        folder,
        updatedFolder,
      };
    })
  );

  results.forEach((res, idx) => {
    const folderId = folders[idx].id;
    if (res.status === 'fulfilled') {
      updatedFolders.push({
        ...res.value.folder,
        parentId: targetFolderId || undefined,
        updatedAt: new Date(res.value.updatedFolder.updatedAt),
      });
    } else {
      console.error(`Failed to move folder ${folderId}:`, res.reason);
      failedFolders.push({
        id: folderId,
        error: res.reason instanceof Error ? res.reason.message : String(res.reason),
      });
    }
  });

  ClientRegistry.getContentTreeManager().store.evictFolderData(currentFolderId || 'root');
  ClientRegistry.getContentTreeManager().store.evictFolderData(targetFolderId || 'root');

  return {
    updated: updatedFolders,
    failed: failedFolders,
  };
}

export async function encryptFolderMetadata(
  metadata: FolderMetadata,
  key: Uint8Array
): Promise<string> {
  const metadataBytes = toUtf8Bytes(JSON.stringify(metadata));
  const envelope = await EncryptionRegistry.get().encrypt(metadataBytes, key);
  return EncryptedEnvelopeCodec.serialize(envelope);
}

export function hashFolderName(name: string): string {
  return blake3HashWithEncoding(name.trim(), 'hex');
}
