'use client';

import { useEffect, useState } from 'react';

export function useServerVersion() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVersion() {
      try {
        const response = await fetch('/api/v1/server/info');
        if (response.ok) {
          const data = await response.json();
          setVersion(data.version);
        }
      } catch {
        return;
      }
    }
    fetchVersion();
  }, []);

  return version;
}
