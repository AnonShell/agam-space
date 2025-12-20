import {
  ContentEntry,
  ContentTreeEntry,
  contentTreeStore,
  FileEntry,
  FolderEntry,
  SortOrder,
} from '../content-tree.store';
import { Folder, FolderMetadata } from '@agam-space/shared-types';
import { fetchFolderAncestorsApi, fetchFolderById, fetchFolderContentsApi } from '../api';
import { EncryptedEnvelopeCodec, fromUtf8Bytes } from '@agam-space/core';
import { EncryptionRegistry } from '../encryption/encryption-strategy';
import { fetchTrashedItemsApi } from '../api';
import { decryptFile } from '../file';
import { ClientRegistry } from '../init/client.registry';
import { SortDirection } from './content-tree/content-tree-v2.store';

export async function loadFolderContentNode(
  folderId: string,
  useCache = true
): Promise<ContentTreeEntry> {
  const page = 1;
  const sortBy = 'name'; // default sort by name
  const sortDirection = 'asc'; // default sort direction

  //TODO need force

  return contentTreeStore.getOrFetch(
    folderId,
    page, // page 1
    sortBy, // default sort by name
    sortDirection, // default sort direction
    async () => fetchFolderContents(folderId),
    async (folderId: string) => getFolderInfo(folderId)
  );
}

export async function loadAncestorsPath(folderId: string, depth: number): Promise<FolderEntry[]> {
  const folder = await contentTreeStore.getFolderMetadata(folderId, async (folderId: string) =>
    getFolderInfo(folderId)
  );

  if (!folder || folder.id === 'root') {
    return [];
  }

  if (folder.parentId && !contentTreeStore.hasFolder(folder.parentId)) {
    const ancestors = await fetchFolderAncestorsApi(folder.parentId, depth);

    for (const ancestor of ancestors) {
      const folderEntry = await decryptFolder(ancestor);
      contentTreeStore.setFolder(folderEntry.id, folderEntry);
    }
  }

  return contentTreeStore.getPath(folderId);
}

export async function loadTrashedItems(): Promise<{
  folders: FolderEntry[];
  files: FileEntry[];
  hasMore: boolean;
}> {
  const trashedItems = await fetchTrashedItemsApi();

  const folderEntries: FolderEntry[] = await Promise.all(
    trashedItems.folders.map(async folder => decryptFolder(folder))
  );

  const fileEntries: FileEntry[] = await Promise.all(
    trashedItems.files.map(async file => decryptFile(file))
  );

  return {
    folders: folderEntries,
    files: fileEntries,
    hasMore: false, // pagination not supported yet
  };
}

export async function fetchFolderContents(folderId: string): Promise<{
  folders: FolderEntry[];
  files: FileEntry[];
  hasMore: boolean;
}> {
  const contents = await fetchFolderContentsApi(folderId);

  const { folders, files } = contents;

  const folderEntries: FolderEntry[] = await Promise.all(
    folders.map(async folder => decryptFolder(folder))
  );

  const fileEntries: FileEntry[] = await Promise.all(files.map(async file => decryptFile(file)));

  return {
    folders: folderEntries,
    files: fileEntries,
    hasMore: false, // pagination not supported yet
  };
}

export async function decryptFolder(folder: Folder): Promise<FolderEntry> {
  const folderKey = await getDecryptedFolderKey(folder.id);
  const metadata = await decryptMetadata(folder.metadataEncrypted, folderKey);
  return {
    id: folder.id,
    name: metadata.name,
    nameHash: folder.nameHash,
    parentId: folder.parentId || 'root',
    isFolder: true,
    createdAt: new Date(metadata.createdAt),
    updatedAt: new Date(folder.updatedAt),
  };
}

// async function decryptFile(file: File): Promise<FileEntry> {
//
//   const fileKey = await getDecryptedFileKey(file);
//   const metadata = await new FileManager().decryptMetadata(file.metadataEncrypted, fileKey);
//   console.log(`decryptFile: fileKey=${fileKey}, metadata=${JSON.stringify(metadata)}`);
//   return {
//     id: file.id,
//     name: metadata.name,
//     mime: metadata.mimeType || 'application/octet-stream',
//     parentId: file.parentFolderId || 'root',
//     size: file.approxSize,
//     isFolder: false,
//     createdAt: new Date(file.createdAt),
//     updatedAt: new Date(file.updatedAt),
//   };
// }

export async function getFolderInfo(folderId: string): Promise<FolderEntry> {
  const folder = await fetchFolderById(folderId);
  if (!folder) {
    throw new Error(`Folder with ID ${folderId} not found`);
  }

  const folderKey = await getDecryptedFolderKey(folder.id);
  const metadata = await decryptMetadata(folder.metadataEncrypted, folderKey);

  return {
    id: folder.id,
    name: metadata.name,
    nameHash: folder.nameHash,
    parentId: folder.parentId || undefined,
    isFolder: true,
    createdAt: new Date(metadata.createdAt),
    updatedAt: new Date(folder.updatedAt),
  };
}

export async function getFoldersInFolder(
  folderId: string | null | undefined,
  page: number = 1,
  sortBy: SortOrder = 'name',
  sortDirection: SortDirection = 'asc'
): Promise<FolderEntry[]> {
  const contentNode = await loadFolderContentNode(folderId ?? 'root', true);
  return contentNode.node.folders;
}

export async function getDecryptedFolderKey(
  folderId: string | null | undefined
): Promise<Uint8Array> {
  // console.log(`getDecryptedFolderKey: folderId=${folderId}`);

  //Root-level folder uses CMK
  if (!folderId || folderId === 'root') {
    const cmk = ClientRegistry.getKeyManager().getCMK();
    if (!cmk) throw new Error('CMK not loaded');
    return cmk;
  }

  // Check if the key is already cached
  const parentKey = ClientRegistry.getKeyManager().getFolderKey(folderId);
  if (parentKey) {
    return parentKey;
  }

  const folder = await fetchFolderById(folderId);
  if (!folder) {
    throw new Error(`Folder with ID ${folderId} not found`);
  }

  const parentFolderKey = await getDecryptedFolderKey(folder.parentId);
  const folderKey = await decryptFolderKey(folder.fkWrapped, parentFolderKey);

  ClientRegistry.getKeyManager().setFolderKey(folderId, folderKey);
  return folderKey;
}

async function decryptFolderKey(
  fkWrapped: string,
  fkEncryptionKey: Uint8Array
): Promise<Uint8Array> {
  const envelope = EncryptedEnvelopeCodec.deserialize(fkWrapped);
  return EncryptionRegistry.get().decrypt(envelope, fkEncryptionKey);
}

async function decryptMetadata(
  metadataEncrypted: string,
  folderKey: Uint8Array
): Promise<FolderMetadata> {
  const envelope = EncryptedEnvelopeCodec.deserialize(metadataEncrypted);
  const metadataBytes = await EncryptionRegistry.get().decrypt(envelope, folderKey);
  return JSON.parse(fromUtf8Bytes(metadataBytes)) as FolderMetadata;
}

export async function moveContentsToFolder(
  entries: ContentEntry[],
  targetFolderId: string
): Promise<void> {
  //
  //   const sourceNode = await loadFolderContentNode(sourceFolderId);
  //   const targetNode = await loadFolderContentNode(targetFolderId);
  //
  //   // Move folders
  //   for (const folder of sourceNode.node.folders) {
  //     folder.parentId = targetFolderId;
  //     contentTreeStore.updateFolder(folder.id, folder);
  //   }
  //
  //   // Move files
  //   for (const file of sourceNode.node.files) {
  //     file.parentFolderId = targetFolderId;
  //     contentTreeStore.updateFile(file.id, file);
  //   }
  //
  //   // Clear the source node
  //   contentTreeStore.clearNode(sourceFolderId);
}
