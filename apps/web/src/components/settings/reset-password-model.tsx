'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchE2eeKeys, resetMasterPassword, validateRecoveryKey } from '@agam-space/client';
import { useState } from 'react';

import { useE2eeKeys } from '@/store/e2ee-keys.store';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ResetPasswordModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { e2eeKeys, setE2eeKeys } = useE2eeKeys();

  const handleVerify = async () => {
    setLoading(true);
    const keys = e2eeKeys || (await fetchE2eeKeys());
    if (!keys) {
      setLoading(false);
      setError('User keys not found. Please set up E2EE keys first.');
      return;
    } else {
      setE2eeKeys(keys);
    }

    const ok = await validateRecoveryKey(recoveryKey, keys);
    if (!ok) {
      return setError('Invalid recovery key');
    }

    setLoading(false);
    setError(null);
    setStep('reset');
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setNewPassword(newPassword.trim());
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    if (!e2eeKeys) {
      return setError('User keys not available');
    }

    if (!e2eeKeys.encIdentitySeed || !e2eeKeys.identityEncPubKey) {
      return setError('User account not fully migrated. Please try again later.');
    }

    const result = await resetMasterPassword(recoveryKey, newPassword, e2eeKeys);

    if (!result.success) {
      return setError(result.error || 'Failed to reset master password');
    }

    setE2eeKeys(result.userKeys!);

    onClose();
    toast.success('Password reset successfully.');
  };

  const resetState = () => {
    setStep('verify');
    setRecoveryKey('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) {
          resetState();
          onClose();
        }
      }}
    >
      <DialogContent className='bg-background'>
        <DialogHeader>
          <DialogTitle>Reset Master Password</DialogTitle>
        </DialogHeader>

        {step === 'verify' && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='recoveryKey'>Enter Recovery Key</Label>
              <Input
                id='recoveryKey'
                type='password'
                autoComplete='off'
                autoCorrect='off'
                spellCheck={false}
                value={recoveryKey}
                onChange={e => {
                  setRecoveryKey(e.target.value);
                  setError(null);
                }}
              />
              {error && <p className='text-sm text-red-500'>{error}</p>}
            </div>
            <Button onClick={handleVerify}>Verify</Button>
          </div>
        )}

        {step === 'reset' && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='newPassword'>New Master Password</Label>
              {error && <p className='text-sm text-red-500'>{error}</p>}
              <Input
                id='newPassword'
                type='password'
                autoComplete='off'
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm New Password</Label>
              <Input
                id='confirmPassword'
                type='password'
                autoComplete='off'
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
              />
            </div>
            <Button onClick={handleReset}>Reset Password</Button>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='ghost'
            onClick={() => {
              resetState();
              onClose();
            }}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
