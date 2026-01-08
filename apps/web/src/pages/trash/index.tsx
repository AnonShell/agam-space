// apps/web/pages/trash/index.tsx
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import TrashExplorerPage from '@/components/pages/trash-explorer-page';
import { PageLoader } from '@/components/page-loader';

export default function TrashRoute() {
  const status = useAccessBootstrap('loggedIn');

  if (status === 'loading') return <PageLoader />;
  if (status === 'redirecting') return null;

  return <TrashExplorerPage />;
}
