import dynamic from 'next/dynamic';
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';

const ExplorerShell = dynamic(() => import('@/components/explorer/explorer-shell'), {
  ssr: false,
});

export default function ExplorerRoute() {
  const status = useAccessBootstrap('unlocked');
  if (status !== 'ready') return null;
  return <ExplorerShell />;
}
