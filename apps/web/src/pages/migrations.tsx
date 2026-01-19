import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import { MigrationRunnerPage } from '@/components/migration-runner-page';
import { PageLoader } from '@/components/page-loader';
import { useSearchParams } from 'next/navigation';

export default function MigrationsRoute() {
  const status = useAccessBootstrap('unlocked');
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/explorer';

  if (status === 'loading') return <PageLoader />;
  if (status === 'redirecting') return null;

  return <MigrationRunnerPage redirectTo={redirectTo} />;
}
