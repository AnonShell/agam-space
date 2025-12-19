'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setupCmkWithPassword } from '@/lib/e2ee';
import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function E2eeSetupPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  const initialKeysRef = useRef(useE2eeKeys.getState().e2eeKeys);

  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  const clipboardSupported = !!navigator.clipboard?.writeText;

  const handleCopy = () => {
    if (!clipboardSupported) {
      console.warn('Clipboard API not supported');
      return;
    }

    navigator.clipboard
      .writeText(recoveryKey)
      .then(() => {
        setCopied(true);

        if (copyTimeout.current) {
          clearTimeout(copyTimeout.current);
        }

        copyTimeout.current = setTimeout(() => {
          setCopied(false);
        }, 1500);
      })
      .catch(err => {
        console.error('Copy failed:', err);
      });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (password !== confirm) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      const { recoveryKey } = await setupCmkWithPassword(password);
      setRecoveryKey(recoveryKey);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (initialKeysRef.current?.encCmkWithPassword) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4'>
        <div className='w-full max-w-md space-y-6 text-center'>
          <h1 className='text-2xl font-semibold text-green-600'>Encryption Already Setup</h1>
          <p className='text-sm text-muted-foreground'>
            Your encryption keys are already configured.
          </p>
          <div className='flex flex-col gap-3'>
            <Button onClick={() => router.replace('/explorer')}>Go to Explorer</Button>
            <Button variant='outline' onClick={() => router.replace('/settings/encryption')}>
              Go to Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-md space-y-6'>
        <div className='text-center space-y-1'>
          <h1 className='text-2xl font-semibold'>Set up Encryption</h1>
          <p className='text-sm text-muted-foreground'>
            You need to set a master password to enable end-to-end encryption.
          </p>
        </div>

        {!recoveryKey && (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>Master Password</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirm'>Confirm Master Password</Label>
              <Input
                id='confirm'
                type='password'
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>

            <Button className='w-full' type='submit' disabled={submitting}>
              {submitting ? 'Setting up...' : 'Enable Encryption'}
            </Button>

            {error && <p className='text-sm text-red-500 text-center'>{error}</p>}
          </form>
        )}
        {recoveryKey && (
          <div className='space-y-6 border p-6 rounded-md bg-muted'>
            <div className='space-y-2 text-center'>
              <h2 className='text-lg font-semibold text-green-600'>Encryption Enabled</h2>
              <p className='text-sm text-muted-foreground'>
                All your folders and files will now be encrypted.
              </p>
              <p className='text-sm text-muted-foreground'>
                Following is your recovery key. You can retrieve it later from settings, but we
                recommend storing it securely now.
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <Input value={recoveryKey} readOnly className='font-mono text-xs' />
              {clipboardSupported && (
                <Button type='button' variant='outline' size='sm' onClick={handleCopy}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='ack'
                checked={acknowledged}
                onChange={e => setAcknowledged(e.target.checked)}
              />
              <label htmlFor='ack' className='text-sm text-muted-foreground'>
                I’ve saved my recovery key securely
              </label>
            </div>

            <Button
              className='w-full'
              onClick={() => router.replace('/explorer')}
              disabled={!acknowledged}
            >
              Continue to Explorer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
