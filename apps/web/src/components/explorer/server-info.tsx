'use client';

import { useServerVersion } from '@/hooks/use-server-version';

const ServerInfo = () => {
  const version = useServerVersion();

  if (!version) return null;

  const isDevBuild = version.startsWith('dev-');
  const githubReleaseUrl = `https://github.com/agam-space/agam-space/releases/tag/v${version}`;

  const content = (
    <div className='flex items-center justify-between gap-2'>
      <span className='text-xs font-medium text-muted-foreground'>Version</span>
      <span className='text-xs font-mono text-foreground'>{version}</span>
    </div>
  );

  if (isDevBuild) {
    return (
      <div className='rounded-lg border border-border bg-card px-3.5 py-2.5 shadow-sm'>
        {content}
      </div>
    );
  }

  return (
    <a
      href={githubReleaseUrl}
      target='_blank'
      rel='noopener noreferrer'
      className='block rounded-lg border border-border bg-card px-3.5 py-2.5 shadow-sm hover:bg-accent/50 transition-colors'
    >
      {content}
    </a>
  );
};

export { ServerInfo };
