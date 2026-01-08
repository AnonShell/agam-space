import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import SignupPage from '@/components/pages/signup';
import { PageLoader } from '@/components/page-loader';

export default function Signup() {
  const status = useAccessBootstrap('public');

  if (status === 'loading') return <PageLoader />;
  if (status === 'redirecting') return null;

  return <SignupPage />;
}
