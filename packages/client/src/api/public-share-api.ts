import {
  CreatePublicShare,
  CreatePublicShareSchema,
  PublicShareDetails,
  PublicShareDetailsSchema,
  PublicShareResponse,
  PublicShareResponseSchema,
  GetPublicShareKeyDetails,
  PublicShareKeys,
  PublicShareKeysSchema,
  PublicShareExternalDetails,
  PublicShareExternalDetailsSchema,
  PublicShareContentResponse,
  PublicShareContentResponseSchema,
} from '@agam-space/shared-types';
import { ClientRegistry } from '../init/client.registry';

export class PublicShareApi {
  static async createShare(data: CreatePublicShare): Promise<PublicShareResponse> {
    console.log('Creating public share with data:', data);
    const validated = CreatePublicShareSchema.parse(data);
    return await ClientRegistry.getApiClient().fetchAndParse(
      '/v1/public-shares',
      PublicShareResponseSchema,
      {
        method: 'POST',
        body: JSON.stringify(validated),
      }
    );
  }

  static async listShares(): Promise<PublicShareDetails[]> {
    return await ClientRegistry.getApiClient().fetchAndParse(
      '/v1/public-shares',
      PublicShareDetailsSchema.array()
    );
  }

  static async revokeShare(shareId: string): Promise<void> {
    await ClientRegistry.getApiClient().fetchRaw(`/v1/public-shares/${shareId}/revoke`, {
      method: 'POST',
    });
  }

  static async getShareMetadata(shareId: string): Promise<PublicShareExternalDetails> {
    return await ClientRegistry.getApiClient().fetchAndParse(
      `/v1/public/share/${shareId}`,
      PublicShareExternalDetailsSchema
    );
  }

  static async getShareKeys(shareId: string, password?: string): Promise<PublicShareKeys> {
    const body: GetPublicShareKeyDetails = { password };
    return await ClientRegistry.getApiClient().fetchAndParse(
      `/v1/public/share/${shareId}/keys`,
      PublicShareKeysSchema,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  static async getShareContent(
    shareId: string,
    accessToken: string,
    folderId?: string
  ): Promise<PublicShareContentResponse> {
    const params = new URLSearchParams();
    if (folderId) {
      params.set('folderId', folderId);
    }

    const endpoint = `/v1/public/share/${shareId}/content${params.toString() ? `?${params.toString()}` : ''}`;

    return await ClientRegistry.getApiClient().fetchAndParse(
      endpoint,
      PublicShareContentResponseSchema,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  static async fetchPublicFileChunk(
    shareId: string,
    accessToken: string,
    fileId: string,
    chunkIndex: number
  ): Promise<Uint8Array> {
    const endpoint = `/v1/public/share/${shareId}/files/${fileId}/chunks/${chunkIndex}`;

    const response = await ClientRegistry.getApiClient().fetchRaw(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return new Uint8Array(await response.arrayBuffer());
  }
}
