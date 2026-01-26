import { ClientRegistry } from '../init/client.registry';
import {
  CreateInviteRequest,
  CreateInviteResponse,
  CreateInviteResponseSchema,
  InviteCodeList,
  InviteCodeListSchema,
  ValidateInviteCodeResponse,
  ValidateInviteCodeResponseSchema,
} from '@agam-space/shared-types';
import { ApiClientError } from './api-client';

export async function createInviteCode(
  request: CreateInviteRequest
): Promise<CreateInviteResponse> {
  try {
    return await ClientRegistry.getApiClient().fetchAndParse(
      '/v1/admin/invite-codes',
      CreateInviteResponseSchema,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    );
  } catch (e) {
    if (e instanceof ApiClientError) {
      if (e.status === 400) {
        throw new Error(e.message || 'Invalid invite code parameters');
      }
    }
    throw new Error('Failed to create invite code');
  }
}

export async function listInviteCodes(): Promise<InviteCodeList> {
  try {
    return await ClientRegistry.getApiClient().fetchAndParse(
      '/v1/admin/invite-codes',
      InviteCodeListSchema,
      {
        method: 'GET',
      }
    );
  } catch (_e) {
    throw new Error('Failed to load invite codes');
  }
}

export async function revokeInviteCode(id: string): Promise<void> {
  try {
    await ClientRegistry.getApiClient().fetchRaw(`/v1/admin/invite-codes/${id}`, {
      method: 'DELETE',
    });
  } catch (e) {
    if (e instanceof ApiClientError) {
      if (e.status === 404) {
        throw new Error('Invite code not found');
      }
    }
    throw new Error('Failed to revoke invite code');
  }
}

export async function validateInviteCode(id: string): Promise<ValidateInviteCodeResponse> {
  try {
    return await ClientRegistry.getApiClient().fetchAndParse(
      `/v1/invite-codes/validate/${id}`,
      ValidateInviteCodeResponseSchema,
      {
        method: 'GET',
      }
    );
  } catch (_e) {
    throw new Error('Failed to validate invite code');
  }
}
