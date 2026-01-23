import { PublicSharesPage } from '@/components/explorer/public-shares-page';
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import { PageLoader } from '@/components/page-loader';

export default function PublicSharesRoute() {
  const status = useAccessBootstrap('unlocked');

  if (status === 'loading') return <PageLoader />;
  if (status === 'redirecting') return null;

  return <PublicSharesPage />;
}
