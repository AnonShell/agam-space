'use client';

import { useServerVersion } from '@/hooks/use-server-version';

const ServerInfo = () => {
  const version = useServerVersion();

  if (!version) return null;

  const githubReleaseUrl = `https://github.com/agam-space/agam-space/releases/tag/v${version}`;

  return (
    <a
      href={githubReleaseUrl}
      target='_blank'
      rel='noopener noreferrer'
      className='block rounded-lg border border-border bg-card px-3.5 py-2.5 shadow-sm hover:bg-accent/50 transition-colors'
    >
      <div className='flex items-center justify-between gap-2'>
        <span className='text-xs font-medium text-muted-foreground'>Version</span>
        <span className='text-xs font-mono text-foreground'>{version}</span>
      </div>
    </a>
  );
};

export { ServerInfo };
