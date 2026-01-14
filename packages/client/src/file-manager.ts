import { EncryptionRegistry } from './encryption/encryption-strategy';
import { blake3HashWithEncoding, EncryptedEnvelopeCodec, randomBytes } from '@agam-space/core';

import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import { UserFileMetadata } from '@agam-space/shared-types';
import { getDecryptedFolderKey } from './folder/folder-contents';

export class FileManager {
  /**
   * Generate a random 256-bit file encryption key (FEK)
   */
  private generateFileKey(): Uint8Array {
    return randomBytes(32);
  }

  async prepareNewFileUpload(metadata: UserFileMetadata, parentId: string | null) {
    const fileKey = this.generateFileKey();

    const parentKey = await getDecryptedFolderKey(parentId);

    const nameHash = blake3HashWithEncoding(metadata.name.trim(), 'hex');
    const metadataBytes = Buffer.from(JSON.stringify(metadata));

    const [encryptedMetadata, fkWrapped] = await Promise.all([
      EncryptionRegistry.get().encrypt(metadataBytes, fileKey),
      EncryptionRegistry.get().encrypt(fileKey, parentKey),
    ]);

    return {
      nameHash,
      metadataEncrypted: EncryptedEnvelopeCodec.serialize(encryptedMetadata),
      fkWrapped: EncryptedEnvelopeCodec.serialize(fkWrapped),
      fileKey,
    };
  }

  /**
   * Encrypt a chunk of data using the file encryption key
   */
  async encryptChunk(
    chunk: Uint8Array,
    fileKey: Uint8Array,
    fileHasher?: ReturnType<typeof blake3.create>
  ): Promise<{
    encChunk: Uint8Array;
    checksum: string;
  }> {
    const envelope = await EncryptionRegistry.get().encrypt(chunk, fileKey);
    const encChunk = EncryptedEnvelopeCodec.serializeToTLV(envelope);

    const checksum = bytesToHex(blake3.create().update(encChunk).digest());

    if (fileHasher) {
      fileHasher.update(encChunk);
    }

    return {
      encChunk,
      checksum,
    };
  }

  async unwrapFileKey(wrappedKey: string, parentKey: Buffer): Promise<Uint8Array> {
    const envelope = EncryptedEnvelopeCodec.deserialize(wrappedKey);
    return await EncryptionRegistry.get().decrypt(envelope, parentKey);
  }

  async decryptChunk(encryptedData: Buffer, fileKey: Uint8Array): Promise<Uint8Array> {
    const envelope = EncryptedEnvelopeCodec.deserializeFromTLV(encryptedData);
    return await EncryptionRegistry.get().decrypt(envelope, fileKey);
  }

  async decryptMetadata(metadataEncrypted: string, fileKey: Uint8Array): Promise<UserFileMetadata> {
    const envelope = EncryptedEnvelopeCodec.deserialize(metadataEncrypted);
    const metadataBytes = await EncryptionRegistry.get().decrypt(envelope, fileKey);
    return JSON.parse(new TextDecoder().decode(metadataBytes)) as UserFileMetadata;
  }
}
