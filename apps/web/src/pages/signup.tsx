import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import SignupPage from '@/components/pages/signup';

export default function Signup() {
  const status = useAccessBootstrap('public');
  if (status !== 'ready') return null;
  return <SignupPage />;
}
