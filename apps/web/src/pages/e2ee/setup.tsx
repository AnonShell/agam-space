import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import E2eeSetupPage from '@/components/pages/e2ee-setup';
import { PageLoader } from '@/components/page-loader';

export default function SetupCMKRoute() {
  const status = useAccessBootstrap('loggedIn');

  if (status === 'loading') return <PageLoader />;
  if (status === 'redirecting') return null;

  return <E2eeSetupPage />;
}
