import { UsersWithQuotaArray, UsersWithQuotaArraySchema } from '@agam-space/shared-types';
import { ClientRegistry } from '../init/client.registry';

export async function fetchUsers(): Promise<UsersWithQuotaArray> {
  return ClientRegistry.getApiClient().fetchAndParse('/v1/admin/users', UsersWithQuotaArraySchema);
}
