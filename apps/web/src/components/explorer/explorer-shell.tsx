'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccessBootstrap } from '@/hooks/useAccessBootstrap';
import { ExplorerPage } from '@/components/explorer/explorer-page';

export default function ExplorerShell() {
  const status = useAccessBootstrap('unlocked');

  const router = useRouter();
  const [folderId, setFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || status !== 'ready') return;

    const parts = router.asPath.split('/').filter(Boolean);
    const folderParts = parts.slice(1);

    const maybeId = folderParts.join('/');
    const folderId = maybeId || 'root';

    setFolderId((prev) => (prev === folderId ? prev : folderId));
  }, [router.isReady, router.asPath, status]);

  if (!folderId) return null; // or loading spinner

  return <ExplorerPage folderId={folderId} />;
}
