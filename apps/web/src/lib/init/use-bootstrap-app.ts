import { useEffect, useState } from 'react';
import { bootstrapApp } from '@/lib/init/bootstrap-app';

export function useAppBootstrap(isPublicRoute: boolean = false) {
  const [appBootstrapped, setAppBootstrapped] = useState(false);

  useEffect(() => {
    bootstrapApp(isPublicRoute).finally(() => setAppBootstrapped(true));
  }, [isPublicRoute]);

  return appBootstrapped;
}
