import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useIsLoggedIn } from '@/store/auth';
import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { resetAllState } from '@/services/session.service';
import { useBootstrapStore } from '@/store/bootstrap.store';
import { ClientRegistry } from '@agam-space/client';

type BootstrapMode = 'public' | 'loggedIn' | 'unlocked';
type BootstrapStatus = 'loading' | 'redirecting' | 'ready';

export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('agam_is_auth=true');
}

function redirectWithQuery(router: ReturnType<typeof useRouter>, path: string, redirectTo: string) {
  router.replace(`${path}?redirectTo=${encodeURIComponent(redirectTo)}`);
}

export function useAccessBootstrap(
  mode: BootstrapMode,
  appBootstrapped: boolean = true
): BootstrapStatus {
  const router = useRouter();
  const pathname = usePathname();

  const isLoggedIn = useIsLoggedIn() && hasSessionCookie();
  const e2eeKeys = useE2eeKeys(s => s.e2eeKeys);

  const [status, setStatus] = useState<BootstrapStatus>('loading');
  const { bootstrapped, setBootstrapped } = useBootstrapStore();

  useEffect(() => {
    if (typeof window === 'undefined' || bootstrapped || !appBootstrapped) return;

    setBootstrapped();
  }, [appBootstrapped, bootstrapped, setBootstrapped]);

  useEffect(() => {
    if (!bootstrapped) return;

    if (mode === 'public') {
      return setStatus('ready');
    }

    if (!isLoggedIn) {
      resetAllState();
      redirectWithQuery(router, '/login', pathname);
      return setStatus('redirecting');
    }

    if (mode === 'loggedIn') {
      return setStatus('ready');
    }

    if (!e2eeKeys) {
      redirectWithQuery(router, '/e2ee/setup', pathname);
      return setStatus('redirecting');
    }

    if (!ClientRegistry.getKeyManager().getCMK() && pathname !== '/e2ee/unlock') {
      redirectWithQuery(router, '/e2ee/unlock', pathname);
      return setStatus('redirecting');
    }

    return setStatus('ready');
  }, [bootstrapped, e2eeKeys, isLoggedIn, mode, pathname, router]);

  return status;
}
