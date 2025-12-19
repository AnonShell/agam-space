// apps/web/pages/unlock.tsx
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import E2eeUnlockPage from '@/components/pages/e2ee-unlock';

export default function UnlockRoute() {
  const status = useAccessBootstrap('loggedIn');

  if (status !== 'ready') return null;

  return <E2eeUnlockPage />;
}
