import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function SettingsRoute() {
  const router = useRouter();
  const status = useAccessBootstrap('loggedIn');

  useEffect(() => {
    if (status === 'ready') {
      // Redirect to default account tab
      router.replace('/settings/account');
    }
  }, [status, router]);

  if (status !== 'ready') return null;

  return null; // Will redirect
}
