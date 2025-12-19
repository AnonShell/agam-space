// apps/web/pages/trash/index.tsx
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import TrashExplorerPage from '@/components/pages/trash-explorer-page';

export default function TrashRoute() {
  const status = useAccessBootstrap('loggedIn');

  if (status !== 'ready') return null;

  return <TrashExplorerPage />;
}
