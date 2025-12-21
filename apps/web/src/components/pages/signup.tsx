'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { signupApi } from '@agam-space/client';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await signupApi(form.username, form.email, form.password);
      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 bg-background text-foreground'>
      <div className='w-full max-w-md space-y-6'>
        <div className='text-center space-y-1'>
          <h1 className='text-2xl font-semibold'>Create your Agam Space account</h1>
          <p className='text-sm text-muted-foreground'>Start your private journey</p>
        </div>

        {success ? (
          <div className='text-center space-y-4'>
            <div className='text-green-600 text-3xl'>✓</div>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold'>Account Created!</h2>
              <p className='text-sm text-muted-foreground'>
                Please log in to continue. You'll set up your master password after login.
              </p>
            </div>
            <div className='text-xs text-muted-foreground'>
              Redirecting to login in 5 seconds...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <Input
                id='username'
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email (optional)</Label>
              <Input
                id='email'
                type='email'
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <Button className='w-full' type='submit'>
              Sign Up
            </Button>

            {error && <p className='text-sm text-red-500 text-center'>{error}</p>}
          </form>
        )}
        {!success && (
          <div className='pt-4 text-center text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link href='/login' className='text-primary font-medium hover:underline'>
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
