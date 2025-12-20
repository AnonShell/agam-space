import { CreatedFolder, Folder, FolderMetadata } from '@agam-space/shared-types';
import { blake3HashWithEncoding } from '@agam-space/core';
import { EncryptionRegistry } from './encryption/encryption-strategy';
import { EncryptedEnvelopeCodec, randomBytes } from '@agam-space/core';
import { getDecryptedFolderKey } from './folder/folder-contents';
import { ApiClientError, createFolderApi } from './api';
import { AlreadyExistsError, AppError } from './errors';
import { ClientRegistry } from './init/client.registry';

export class FolderManager {
  /**
   * Generate a random 256-bit folder key
   * Each folder gets its own unique encryption key
   */
  generateFolderKey(): Uint8Array {
    return randomBytes(32);
  }

  /**
   * Create a new folder with encrypted metadata
   *
   * @param name - Folder name
   * @param cmk - Content Master Key for root folders
   * @param fkEncryptionKey - Parent folder key for subfolders
   * @param parentId - Parent folder ID (undefined for root folders)
   * @returns Encrypted folder data ready for API
   */
  async createFolder(
    name: string,
    fkEncryptionKey: Uint8Array,
    parentId?: string
  ): Promise<CreatedFolder> {
    // Generate name hash for uniqueness check
    const nameHash = blake3HashWithEncoding(name.toLowerCase().trim(), 'hex');

    const newFolderKey = this.generateFolderKey();

    // Create and encrypt metadata
    const metadata: FolderMetadata = {
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const metadataBytes = Buffer.from(JSON.stringify(metadata));

    const [encryptedMetadata, fkWrapped] = await Promise.all([
      EncryptionRegistry.get().encrypt(metadataBytes, newFolderKey),
      EncryptionRegistry.get().encrypt(newFolderKey, fkEncryptionKey),
    ]);

    return {
      parentId,
      nameHash,
      metadataEncrypted: EncryptedEnvelopeCodec.serialize(encryptedMetadata),
      fkWrapped: EncryptedEnvelopeCodec.serialize(fkWrapped),
    };
  }

  async decryptFolderKey(fkWrapped: string, fkEncryptionKey: Uint8Array): Promise<Uint8Array> {
    const envelope = EncryptedEnvelopeCodec.deserialize(fkWrapped);
    return EncryptionRegistry.get().decrypt(envelope, fkEncryptionKey);
  }

  async decryptMetadata(metadataEncrypted: string, folderKey: Uint8Array): Promise<FolderMetadata> {
    const envelope = EncryptedEnvelopeCodec.deserialize(metadataEncrypted);
    const metadataBytes = await EncryptionRegistry.get().decrypt(envelope, folderKey);
    return JSON.parse(new TextDecoder().decode(metadataBytes)) as FolderMetadata;
  }
}

export async function createNewFolder(name: string, parentId?: string): Promise<Folder> {
  const parentKey = await getDecryptedFolderKey(parentId);

  const folderManager = new FolderManager();
  const folderData = await folderManager.createFolder(name, parentKey, parentId);

  try {
    const folder = await createFolderApi(folderData);
    const folderKey = await folderManager.decryptFolderKey(folder.fkWrapped, parentKey);
    ClientRegistry.getKeyManager().setFolderKey(folder.id, folderKey);

    return folder;
  } catch (e) {
    if (e instanceof ApiClientError) {
      if (e.status === 409) {
        const message = `Folder with name "${name}" already exists in this location.`;
        throw new AlreadyExistsError(message, {
          errorCode: 'FOLDER_ALREADY_EXISTS',
          errorMessage: e.message,
        });
      }
    }

    throw new AppError(`Failed to create folder: ${e}`, {
      errorCode: 'FOLDER_CREATION_FAILED',
      errorMessage: 'Failed to create folder',
    });
  }
}
