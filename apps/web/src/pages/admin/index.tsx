// pages/admin/index.tsx
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import AdminPage from '@/components/pages/admin';

export default function AdminRoute() {
  const status = useAccessBootstrap('loggedIn');
  const user = useAuth((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (status === 'ready' && !(user?.role === 'admin' || user?.role === 'owner')) {
      router.replace('/explorer');
    }
  }, [status, user, router]);

  if (status !== 'ready') return null;

  return <AdminPage />;
}
