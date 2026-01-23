import { PublicShareApi } from './api';
import { PublicShareCrypto } from './public-share-crypto';
import { CreatePublicShare } from '@agam-space/shared-types';

export interface CreatePublicShareOptions {
  itemId: string;
  itemType: 'folder' | 'file';
  password?: string;
  expiresAt?: Date;
}

export interface PublicShareResult {
  shareId: string;
  shareUrl: string;
  clientKey: string;
}

export class PublicShareService {
  static async createShare(
    options: CreatePublicShareOptions,
    itemKey: Uint8Array
  ): Promise<PublicShareResult> {
    const { itemId, itemType, password, expiresAt } = options;
    if (!itemKey) {
      throw new Error('Item key is required to create a public share');
    }

    const clientKey = PublicShareCrypto.generateClientKey();
    const serverShareKey = PublicShareCrypto.generateServerShareKey();
    const salt = PublicShareCrypto.generateSalt();

    const wrapKey = await PublicShareCrypto.deriveWrapKey(
      clientKey,
      serverShareKey,
      salt,
      password
    );
    const wrappedItemKey = await PublicShareCrypto.wrapKey(itemKey, wrapKey);

    const payload: CreatePublicShare = {
      itemId,
      itemType,
      serverShareKey,
      wrappedItemKey,
      salt,
      password,
      expiresAt: expiresAt?.toISOString(),
    };

    const response = await PublicShareApi.createShare(payload);

    const shareUrl = PublicShareCrypto.buildShareUrl(response.id, clientKey);

    return {
      shareId: response.id,
      shareUrl,
      clientKey,
    };
  }

  static async revokeShare(shareId: string): Promise<void> {
    await PublicShareApi.revokeShare(shareId);
  }

  static async listShares() {
    return await PublicShareApi.listShares();
  }
}
