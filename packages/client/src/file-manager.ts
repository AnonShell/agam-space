import { EncryptionRegistry } from './encryption/encryption-strategy';
import { EncryptedEnvelopeCodec, randomBytes } from '@agam-space/core';

import { blake3 } from '@noble/hashes/blake3';
import { blake3HashWithEncoding } from '@agam-space/core';
import { bytesToHex } from '@noble/hashes/utils';
import { UserFileMetadata } from '@agam-space/shared-types';
import { getDecryptedFolderKey } from './folder/folder-contents';

// export interface RawFileMetadata {
//   name: string;
//   size: number;
//   mimeType?: string; // optional, can be determined from file extension
//
//   createdAt: string;      // from file system or EXIF
//   modifiedAt: string;     // last modified
//
//   customTags?: string[];  // optional - custom tags for user-defined metadata
//
//   extra?: Record<string, any>; // reserved for extensibility
// }
export interface FileUploadOptions {
  parentFolderId: string;
  chunkSize?: number;
}

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

  // /**
  //  * Create a readable stream that yields encrypted chunks
  //  */
  // async createEncryptedReadStream(
  //   filePath: string,
  //   fileKey: Uint8Array,
  //   chunkSize = this.DEFAULT_CHUNK_SIZE
  // ): Promise<{
  //   stream: Readable;
  //   totalSize: number;
  //   checksum: string;
  // }> {
  //   const fileStream = createReadStream(filePath, { highWaterMark: chunkSize });
  //   const chunks: Buffer[] = [];
  //   let totalSize = 0;
  //
  //   for await (const chunk of fileStream) {
  //     const { encryptedData } = await this.encryptChunk(chunk, fileKey);
  //     chunks.push(Buffer.from(encryptedData));
  //     totalSize += encryptedData.length;
  //   }
  //
  //   const fullData = Buffer.concat(chunks);
  //   const checksum = createHash('blake3').update(fullData).digest('hex');
  //
  //   const stream = Readable.from(chunks);
  //
  //   return {
  //     stream,
  //     totalSize,
  //     checksum,
  //   };
  // }
}
