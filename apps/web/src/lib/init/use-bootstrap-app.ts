import { useEffect, useState } from 'react';
import { bootstrapApp } from '@/lib/init/bootstrap-app';

export function useAppBootstrap() {
  const [appBootstrapped, setAppBootstrapped] = useState(false);

  useEffect(() => {
    bootstrapApp().finally(() => setAppBootstrapped(true));
  }, []);

  return appBootstrapped;
}
