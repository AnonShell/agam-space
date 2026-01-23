import { resetAllState, SessionService } from '@/services/session.service';
import { initializeClient } from './initialise-client';
import { ServerConfigService } from '@/services/server-config.service';
import { applyThemeFromLocalStorage } from '@/lib/theme';

let bootstrapped = false;

export async function bootstrapApp(isPublic: boolean = false) {
  if (bootstrapped) return;
  bootstrapped = true;

  console.log(`[init] Bootstrapping ${isPublic ? 'public' : 'authenticated'} app...`);

  await initializeClient(isPublic);

  applyThemeFromLocalStorage();

  if (!isPublic) {
    await bootstrapAuthenticatedApp();
  }
}

async function bootstrapAuthenticatedApp() {
  await ServerConfigService.getConfig(false);

  if (document.cookie.includes('agam_is_auth=true')) {
    try {
      await SessionService.bootstrap();
    } catch (error) {
      console.warn('[init] Failed to bootstrap session:', error);
    }
  } else {
    await resetAllState();
  }
}
