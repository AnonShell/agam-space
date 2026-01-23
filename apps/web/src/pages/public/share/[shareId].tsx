import { PublicSharePage } from '@/components/public-share/public-share-page';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/page-loader';

export default function PublicShareRoute() {
  const router = useRouter();
  const { shareId } = router.query;
  const [clientKey, setClientKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        setClientKey(hash.substring(1));
      }
    }
  }, []);

  if (!router.isReady || !shareId) {
    return <PageLoader />;
  }

  if (typeof shareId !== 'string') {
    return <PageLoader />;
  }

  return <PublicSharePage shareId={shareId} clientKey={clientKey} />;
}
