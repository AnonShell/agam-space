import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useIsLoggedIn, useAuth } from '@/store/auth';
import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { resetAllState } from '@/services/session.service';
import { useBootstrapStore } from '@/store/bootstrap.store';
import { ClientRegistry } from '@agam-space/client';
import { SessionUnlockManager } from '@/services/session-unlock-manager';
import { IdentityKeyManager } from '@agam-space/core';

type BootstrapMode = 'public' | 'loggedIn' | 'unlocked';
type BootstrapStatus = 'loading' | 'redirecting' | 'ready';

export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('agam_is_auth=true');
}

function redirectWithQuery(router: ReturnType<typeof useRouter>, path: string, redirectTo: string) {
  router.replace(`${path}?redirectTo=${encodeURIComponent(redirectTo)}`);
}

async function restoreCMKForAutoUnlockIfAvailable() {
  const restoredCmk = await SessionUnlockManager.restoreCMKForAutoUnlock();
  if (restoredCmk) {
    const identityKeyPair = await IdentityKeyManager.generateIdentityKeyPair(restoredCmk);
    ClientRegistry.getKeyManager().setCMK(restoredCmk);
    ClientRegistry.getKeyManager().setIdentityKeyPair(identityKeyPair);
  }
}

export function useAccessBootstrap(
  mode: BootstrapMode,
  appBootstrapped: boolean = true
): BootstrapStatus {
  const router = useRouter();
  const pathname = usePathname();

  const isLoggedIn = useIsLoggedIn() && hasSessionCookie();
  const user = useAuth(s => s.user);
  const e2eeKeys = useE2eeKeys(s => s.e2eeKeys);

  const [status, setStatus] = useState<BootstrapStatus>('loading');
  const { bootstrapped, setBootstrapped } = useBootstrapStore();

  useEffect(() => {
    if (typeof window === 'undefined' || bootstrapped || !appBootstrapped) return;

    setBootstrapped();
  }, [appBootstrapped, bootstrapped, setBootstrapped]);

  useEffect(() => {
    // For public mode, we can be ready immediately
    if (mode === 'public') {
      setStatus('ready');
      return;
    }

    // Wait for bootstrap to complete for protected routes
    if (!bootstrapped) {
      setStatus('loading');
      return;
    }

    // Bootstrap complete, now check auth state
    if (!isLoggedIn) {
      resetAllState();
      redirectWithQuery(router, '/login', pathname);
      setStatus('redirecting');
      return;
    }

    // User is logged in - for 'loggedIn' mode, we're ready
    if (mode === 'loggedIn') {
      setStatus('ready');
      return;
    }

    // For 'unlocked' mode, check E2EE setup
    if (!e2eeKeys) {
      redirectWithQuery(router, '/e2ee/setup', pathname);
      setStatus('redirecting');
      return;
    }

    async function checkUnlockStatus() {
      if (!ClientRegistry.getKeyManager().getCMK() && user?.id) {
        await restoreCMKForAutoUnlockIfAvailable();
      }

      if (!ClientRegistry.getKeyManager().getCMK() && pathname !== '/e2ee/unlock') {
        redirectWithQuery(router, '/e2ee/unlock', pathname);
        setStatus('redirecting');
        return;
      }

      setStatus('ready');
    }

    checkUnlockStatus();
  }, [bootstrapped, e2eeKeys, isLoggedIn, mode, pathname, router, user]);

  return status;
}
