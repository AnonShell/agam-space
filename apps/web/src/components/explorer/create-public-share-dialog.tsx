'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDecryptedFileKeyById,
  getDecryptedFolderKey,
  PublicShareService,
} from '@agam-space/client';

type DurationUnit = 'minutes' | 'hours' | 'days';

interface CreatePublicShareDialogProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  itemType: 'folder' | 'file';
  onShareCreated?: (shareUrl: string) => void;
}

export function CreatePublicShareDialog({
  open,
  onClose,
  itemId,
  itemName,
  itemType,
  onShareCreated,
}: CreatePublicShareDialogProps) {
  const [password, setPassword] = useState('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [enableExpiry, setEnableExpiry] = useState(true); // Default to enabled
  const [duration, setDuration] = useState('2');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('days');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setEnablePassword(false);
      setEnableExpiry(true);
      setDuration('2');
      setDurationUnit('days');
      setShareUrl(null);
      setCopied(false);
    }
  }, [open]);

  const calculateExpiryDate = (): Date => {
    const now = new Date();
    const durationNum = parseInt(duration) || 0;
    switch (durationUnit) {
      case 'minutes':
        return new Date(now.getTime() + durationNum * 60 * 1000);
      case 'hours':
        return new Date(now.getTime() + durationNum * 60 * 60 * 1000);
      case 'days':
        return new Date(now.getTime() + durationNum * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + durationNum * 60 * 60 * 1000);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const itemKey = await (itemType === 'folder'
        ? getDecryptedFolderKey(itemId)
        : getDecryptedFileKeyById(itemId));

      const result = await PublicShareService.createShare(
        {
          itemId,
          itemType,
          password: enablePassword ? password : undefined,
          expiresAt: enableExpiry ? calculateExpiryDate() : undefined,
        },
        itemKey
      );

      setShareUrl(result.shareUrl);
      onShareCreated?.(result.shareUrl);
      toast.success('Public share created successfully');
    } catch (error) {
      toast.error('Failed to create share');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Share URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canCreate =
    !isCreating &&
    (!enablePassword || password.trim().length > 0) &&
    (!enableExpiry || (parseInt(duration) > 0 && durationUnit));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='bg-background'>
        <DialogHeader>
          <DialogTitle>Share {itemType === 'folder' ? 'Folder' : 'File'}</DialogTitle>
        </DialogHeader>

        {!shareUrl ? (
          <div className='space-y-4'>
            <div className='text-sm text-muted-foreground'>
              Share &quot;{itemName}&quot; with anyone who has the link
            </div>

            {/* Password Protection */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='enable-password' className='cursor-pointer'>
                  Password protect
                </Label>
                <Switch
                  id='enable-password'
                  checked={enablePassword}
                  onCheckedChange={setEnablePassword}
                />
              </div>
              {enablePassword && (
                <Input
                  type='password'
                  placeholder='Enter password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete='off'
                />
              )}
            </div>

            {/* Expiry */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='enable-expiry' className='cursor-pointer'>
                  Set expiration
                </Label>
                <Switch
                  id='enable-expiry'
                  checked={enableExpiry}
                  onCheckedChange={setEnableExpiry}
                />
              </div>
              {enableExpiry && (
                <div className='flex gap-2'>
                  <Input
                    type='number'
                    min='1'
                    placeholder='Duration'
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className='flex-1'
                  />
                  <Select
                    value={durationUnit}
                    onValueChange={(v: DurationUnit) => setDurationUnit(v)}
                  >
                    <SelectTrigger className='w-[130px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position='popper' sideOffset={4} className='bg-background'>
                      <SelectItem value='minutes'>Minutes</SelectItem>
                      <SelectItem value='hours'>Hours</SelectItem>
                      <SelectItem value='days'>Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg'>
              <p className='text-sm text-yellow-800 dark:text-yellow-200 font-medium'>
                ⚠️ Important: Save this link now!
              </p>
              <p className='text-xs text-yellow-700 dark:text-yellow-300 mt-1'>
                This link contains a client-side encryption key and will only be shown once. You
                won&apos;t be able to retrieve it later.
              </p>
            </div>
            <div className='text-sm text-muted-foreground'>Share this link</div>
            <div className='flex gap-2'>
              <Input readOnly value={shareUrl} className='flex-1' />
              <Button variant='outline' size='icon' onClick={handleCopyUrl}>
                {copied ? (
                  <Check className='h-4 w-4 text-green-500' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className='pt-2'>
          {!shareUrl ? (
            <>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!canCreate}>
                {isCreating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create Share
              </Button>
            </>
          ) : (
            <Button onClick={onClose} className='w-full'>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
