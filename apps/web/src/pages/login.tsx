import LoginPage from '@/components/pages/login';
import { useAppBootstrap } from '@/lib/init/use-bootstrap-app';
import { hasSessionCookie } from '@/hooks/useAccessBootstrap';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

export default function Login() {

  const appBootstrapped = useAppBootstrap();
  const router = useRouter();

  if (!appBootstrapped) return null;

  if (hasSessionCookie() && useAuth.getState().user) {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirectTo') || '/explorer';
    router.replace(redirectTo);
    return null;
  }

  return <LoginPage />;
}
