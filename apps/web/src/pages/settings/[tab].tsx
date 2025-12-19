import SettingsPage from '@/components/pages/settings';
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import { useRouter } from 'next/router';

const VALID_TABS = ['account', 'encryption', 'trusted-devices'];

export default function SettingsTabPage() {
  const router = useRouter();
  const { tab } = router.query;
  const status = useAccessBootstrap('loggedIn');

  if (status !== 'ready') return null;

  // If tab is invalid, redirect to account tab
  if (tab && typeof tab === 'string' && !VALID_TABS.includes(tab.toLowerCase())) {
    router.replace('/settings/account');
    return null;
  }

  return <SettingsPage initialTab={typeof tab === 'string' ? tab : 'account'} />;
}
