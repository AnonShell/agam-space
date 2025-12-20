import { UsersArray, UsersArraySchema } from '@agam-space/shared-types';
import { ClientRegistry } from '../init/client.registry';

export async function fetchUsers(): Promise<UsersArray> {
  return ClientRegistry.getApiClient().fetchAndParse('/v1/admin/users', UsersArraySchema);
}
