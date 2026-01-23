'use client';

import { useEffect, useState } from 'react';
import { PublicShareService } from '@agam-space/client';
import { PublicShareDetails } from '@agam-space/shared-types';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Folder, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function PublicSharesSection() {
  const [shares, setShares] = useState<PublicShareDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadShares = async () => {
    try {
      setLoading(true);
      const data = await PublicShareService.listShares();
      setShares(data);
    } catch (error) {
      console.error('Failed to load shares:', error);
      toast.error('Failed to load public shares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleRevoke = async (shareId: string) => {
    try {
      setRevokingId(shareId);
      await PublicShareService.revokeShare(shareId);
      toast.success('Share revoked successfully');
      await loadShares(); // Reload list
    } catch (error) {
      console.error('Failed to revoke share:', error);
      toast.error('Failed to revoke share');
    } finally {
      setRevokingId(null);
    }
  };

  const formatExpiry = (expiresAt?: Date | string | null) => {
    if (!expiresAt) return 'Never';
    const date = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const now = new Date();
    if (date < now) return 'Expired';
    return `Expires ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Public Shares</h2>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>Public Shares</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage your publicly shared folders and files
          </p>
        </div>
        <Button onClick={loadShares} disabled={loading} size='sm' variant='secondary'>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className='border rounded-xl overflow-hidden'>
        {shares.length === 0 ? (
          <div className='p-8 text-center text-muted-foreground'>
            <p>No public shares yet</p>
            <p className='text-sm mt-1'>
              Right-click any file or folder in the explorer and select &quot;Share&quot; to create
              one
            </p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead className='bg-muted text-muted-foreground'>
              <tr>
                <th className='text-left px-4 py-2'>Type</th>
                <th className='text-left px-4 py-2'>Share ID</th>
                <th className='text-left px-4 py-2'>Created</th>
                <th className='text-left px-4 py-2'>Expires</th>
                <th className='text-left px-4 py-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shares.map(share => (
                <tr key={share.id} className='border-t hover:bg-accent/50'>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2'>
                      {share.itemType === 'folder' ? (
                        <Folder className='h-4 w-4 text-yellow-500' />
                      ) : (
                        <FileText className='h-4 w-4 text-blue-500' />
                      )}
                      <span className='capitalize'>{share.itemType}</span>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <code className='text-xs font-mono bg-muted px-2 py-0.5 rounded'>
                      {share.id}
                    </code>
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {formatExpiry(share.expiresAt)}
                  </td>
                  <td className='px-4 py-3'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRevoke(share.id)}
                      disabled={revokingId === share.id}
                      className='h-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                    >
                      {revokingId === share.id ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <>
                          <Trash2 className='h-4 w-4 mr-1' />
                          Revoke
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
