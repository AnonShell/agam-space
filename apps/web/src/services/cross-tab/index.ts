import { CrossTabBroadcastService } from './broadcast.service';
import { ClientSeedSync } from './client-seed-sync';
import { LogoutSync } from './logout-sync';

export function initCrossTabCommunication() {
  const supported = CrossTabBroadcastService.init();

  if (!supported) {
    return false;
  }

  ClientSeedSync.init();
  LogoutSync.init();

  return true;
}

export function destroyCrossTabCommunication() {
  CrossTabBroadcastService.destroy();
}

export { CrossTabBroadcastService } from './broadcast.service';
export { ClientSeedSync } from './client-seed-sync';
export { LogoutSync } from './logout-sync';
