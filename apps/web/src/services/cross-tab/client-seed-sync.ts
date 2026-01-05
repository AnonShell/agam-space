import { CrossTabBroadcastService } from './broadcast.service';
import { SessionUnlockManager } from '@/services/session-unlock-manager';
import { fromBase64, toBase64 } from '@agam-space/core';

export const ClientSeedSync = {
  MESSAGE_TYPES: {
    REQUEST: 'cross-tab:client-seed:request',
    RESPONSE: 'cross-tab:client-seed:response',
  } as const,

  init() {
    CrossTabBroadcastService.on(this.MESSAGE_TYPES.REQUEST, message => {
      const clientSeed = SessionUnlockManager.getClientSeed();
      if (clientSeed && message.requestId) {
        CrossTabBroadcastService.respond(
          this.MESSAGE_TYPES.RESPONSE,
          message.requestId,
          toBase64(clientSeed)
        );
      }
    });
  },

  async requestFromOtherTabs(): Promise<Uint8Array | null> {
    console.log('Requesting client seed from other tabs...');
    const seed = await CrossTabBroadcastService.request<string>(
      this.MESSAGE_TYPES.REQUEST,
      this.MESSAGE_TYPES.RESPONSE
    );

    return seed ? fromBase64(seed) : null;
  },
};
