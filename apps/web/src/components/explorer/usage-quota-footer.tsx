'use client';

import { useEffect } from 'react';
import { Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/utils/file';
import { useUserQuotaStore } from '@/store/user-quota.store';

export function UserQuotaFooter() {
  const { used, max, refresh } = useUserQuotaStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (used === null) return null;

  const isUnlimited = max === 0 || max === null;
  const percent = !isUnlimited ? Math.min((used / max) * 100, 100) : null;
  return (
    <div className='mt-6 pt-4 border-t text-xs text-muted-foreground'>
      <div className='flex items-center gap-1'>
        {formatBytes(used)} used /{' '}
        {max ? (
          <>
            {formatBytes(max)}
            {typeof percent === 'number' && (
              <span
                className={cn(
                  'ml-1',
                  percent >= 90 ? 'text-destructive font-medium' : 'text-muted-foreground'
                )}
              >
                ({Math.round(percent)}%)
              </span>
            )}
          </>
        ) : (
          <span className='flex items-center gap-1 ml-1'>
            <InfinityIcon className='w-3 h-3' />
          </span>
        )}
      </div>
    </div>
  );
}
