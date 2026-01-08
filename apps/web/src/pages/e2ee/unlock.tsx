// apps/web/pages/unlock.tsx
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import E2eeUnlockPage from '@/components/pages/e2ee-unlock';
import { PageLoader } from '@/components/page-loader';

export default function UnlockRoute() {
  const status = useAccessBootstrap('loggedIn');

  if (status === 'loading') return <PageLoader />;
  if (status === 'redirecting') return null;

  return <E2eeUnlockPage />;
}
