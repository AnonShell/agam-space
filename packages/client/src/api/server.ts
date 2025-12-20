import { ServerConfig, ServerConfigSchema } from '@agam-space/shared-types';
import { ClientRegistry } from '../init/client.registry';

export async function fetchServerConfigApi(): Promise<ServerConfig> {
  return ClientRegistry.getApiClient().fetchAndParse('/v1/server/config', ServerConfigSchema);
}
