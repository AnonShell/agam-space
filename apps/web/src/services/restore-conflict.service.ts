import {
  encryptFileMetadata,
  encryptFolderMetadata,
  FileEntry,
  FolderEntry,
  getDecryptedFileKeyById,
  getDecryptedFolderKey,
} from '@agam-space/client';
import { batchCheckFileExists, batchCheckFolderExists, hashFileName } from '@agam-space/client';
import { FolderMetadata, UserFileMetadata } from '@agam-space/shared-types';

export class RestoreConflictService {
  /**
   * Generate a new name with suffix for conflict resolution
   * Examples:
   *   generateNameWithSuffix("document.pdf", 1) => "document (1).pdf"
   *   generateNameWithSuffix("folder", 2) => "folder (2)"
   */
  static generateNameWithSuffix(originalName: string, suffix: number): string {
    const lastDot = originalName.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return `${originalName} (${suffix})`;
    }
    const name = originalName.substring(0, lastDot);
    const ext = originalName.substring(lastDot);
    return `${name} (${suffix})${ext}`;
  }

  /**
   * Check if a name conflicts with existing items at target location
   */
  static async checkNameConflict(
    nameHash: string,
    parentId: string | null,
    isFolder: boolean
  ): Promise<boolean> {
    const checkResult = isFolder
      ? await batchCheckFolderExists([{ parentId, nameHash }])
      : await batchCheckFileExists([{ parentId, nameHash }]);

    return checkResult.results[0].exists;
  }

  /**
   * Find an available name by trying suffixes until one doesn't conflict
   * Requires hashFileName function to compute hashes for candidate names
   */
  static async findAvailableName(
    baseName: string,
    parentId: string | null,
    isFolder: boolean
  ): Promise<{ name: string; suffix: number }> {
    let suffix = 1;
    const maxAttempts = 100;

    while (suffix <= maxAttempts) {
      const candidateName = this.generateNameWithSuffix(baseName, suffix);
      const nameHash = hashFileName(candidateName);

      const checkResult = isFolder
        ? await batchCheckFolderExists([{ parentId, nameHash }])
        : await batchCheckFileExists([{ parentId, nameHash }]);

      if (!checkResult.results[0].exists) {
        return { name: candidateName, suffix };
      }

      suffix++;
    }

    throw new Error('Could not find available name after 100 attempts');
  }

  /**
   * Handle restore with name conflict resolution
   * Returns both nameHash and metadataEncrypted for the new name
   */
  static async handleRestoreWithConflict(
    itemName: string,
    parentId: string | null,
    isFolder: boolean,
    itemId: string,
    existingItem: FileEntry | FolderEntry
  ): Promise<{
    finalName: string;
    renameData?: { nameHash: string; metadataEncrypted: string };
    hasConflict: boolean;
  }> {
    const hasConflict = await this.checkNameConflict(hashFileName(itemName), parentId, isFolder);
    if (!hasConflict) {
      return { finalName: itemName, hasConflict: false };
    }

    const { name: newName } = await this.findAvailableName(itemName, parentId, isFolder);

    const nameHash = hashFileName(newName);

    let metadataEncrypted = '';
    try {
      let encryptionKey: Uint8Array;

      if (isFolder) {
        encryptionKey = await getDecryptedFolderKey(itemId);
        const updatedMetadata: FolderMetadata = {
          ...(existingItem.metadata as FolderMetadata),
          name: newName,
        };
        metadataEncrypted = await encryptFolderMetadata(updatedMetadata, encryptionKey);
      } else {
        encryptionKey = await getDecryptedFileKeyById(itemId);

        const updatedMetadata: UserFileMetadata = {
          ...(existingItem.metadata as UserFileMetadata),
          name: newName,
        };
        metadataEncrypted = await encryptFileMetadata(updatedMetadata, encryptionKey);
      }
    } catch (err) {
      console.error('Failed to encrypt new metadata:', err);
      throw new Error('Failed to prepare renamed file/folder for restore');
    }

    return {
      finalName: newName,
      renameData: { nameHash, metadataEncrypted },
      hasConflict: true,
    };
  }
}
