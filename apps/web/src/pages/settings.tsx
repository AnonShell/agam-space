import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { PageLoader } from '@/components/page-loader';

export default function SettingsRoute() {
  const router = useRouter();
  const status = useAccessBootstrap('loggedIn');

  useEffect(() => {
    if (status === 'ready') {
      // Redirect to default account tab
      router.replace('/settings/account');
    }
  }, [status, router]);

  if (status === 'loading') return <PageLoader />;

  return null; // Will redirect
}
