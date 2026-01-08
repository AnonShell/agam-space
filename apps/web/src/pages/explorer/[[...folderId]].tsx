import dynamic from 'next/dynamic';
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import { PageLoader } from '@/components/page-loader';

const ExplorerShell = dynamic(() => import('@/components/explorer/explorer-shell'), {
  ssr: false,
});

export default function ExplorerRoute() {
  const status = useAccessBootstrap('unlocked');

  if (status === 'loading') return <PageLoader />;
  if (status === 'redirecting') return null;

  return <ExplorerShell />;
}
