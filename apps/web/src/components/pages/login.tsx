'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useServerConfigStore } from '@/store/server-config.store';
import Link from 'next/link';
import { SessionService } from '@/services/session.service';
import { parseError } from '@/lib/error-utils';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const config = useServerConfigStore(s => s.config);
  const ssoEnabled = config?.sso?.enabled === true;
  const signupEnabled = config?.account?.allowNewSignup === true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await SessionService.login(form.username, form.password);

      router.push('/explorer');
    } catch (err) {
      const { message } = parseError(err);
      setError(message);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-background text-foreground'>
      <div className='w-full max-w-md space-y-6'>
        <div className='text-center space-y-1'>
          <h1 className='text-2xl font-semibold'>Sign in to Agam Space</h1>
          <p className='text-sm text-muted-foreground'>Private. Secure. Yours.</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='username'>Username</Label>
            <Input
              id='username'
              type='text'
              autoComplete='username'
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              autoComplete='current-password'
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <Button className='w-full' type='submit'>
            Continue
          </Button>

          {error && <p className='text-sm text-destructive text-center'>{error}</p>}
        </form>
        {ssoEnabled && (
          <>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>Or</span>
              </div>
            </div>
            <Button
              variant='secondary'
              className='w-full'
              onClick={() => (window.location.href = '/api/v1/auth/sso/oidc')}
            >
              Login with SSO
            </Button>
          </>
        )}
        {signupEnabled && (
          <div className='pt-4 text-center text-sm text-muted-foreground'>
            Don’t have an account?{' '}
            <Link href='/signup' className='text-primary font-medium hover:underline'>
              Create one
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
