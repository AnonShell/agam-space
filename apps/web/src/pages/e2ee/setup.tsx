// apps/web/pages/e2ee/setup.tsx
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import E2eeSetupPage from '@/components/pages/e2ee-setup';

export default function SetupCMKRoute() {
  const status = useAccessBootstrap('loggedIn');

  if (status !== 'ready') return null;

  return <E2eeSetupPage />;
}
