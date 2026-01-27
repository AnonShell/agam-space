'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { signupApi, validateInviteCode } from '@agam-space/client';
import Link from 'next/link';
import { useServerConfigStore } from '@/store/server-config.store';
import { parseError } from '@/lib/error-utils';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('inviteCode');

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [assignedEmail, setAssignedEmail] = useState<string | null>(null);

  const config = useServerConfigStore(s => s.config);
  const ssoSignupEnabled = config?.sso?.enabled === true && config?.sso?.autoCreateUser === true;
  const signupEnabled = config?.account?.allowNewSignup === true;

  useEffect(() => {
    if (inviteCode) {
      setValidatingInvite(true);
      validateInviteCode(inviteCode)
        .then(result => {
          if (result.valid) {
            setInviteValid(true);
            if (result.assignedEmail) {
              setAssignedEmail(result.assignedEmail);
              setForm(prev => ({ ...prev, email: result.assignedEmail || '' }));
            }
          } else {
            setInviteError(result.reason || 'Invalid invite code');
          }
        })
        .catch(_err => {
          setInviteError('Failed to validate invite code');
        })
        .finally(() => {
          setValidatingInvite(false);
        });
    }
  }, [inviteCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await signupApi(form.username, form.email, form.password, inviteCode || undefined);
      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } catch (err) {
      const { message, fieldErrors: validationErrors } = parseError(err);

      if (validationErrors) {
        const errorMap: Record<string, string> = {};
        validationErrors.forEach(e => {
          errorMap[e.field] = e.message;
        });
        setFieldErrors(errorMap);
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Check if signup is allowed
  const canSignup = signupEnabled || inviteValid;

  if (validatingInvite) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4 bg-background text-foreground'>
        <div className='w-full max-w-md text-center space-y-4'>
          <div className='text-muted-foreground'>Validating invite code...</div>
        </div>
      </div>
    );
  }

  if (inviteCode && inviteError) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4 bg-background text-foreground'>
        <div className='w-full max-w-md space-y-6'>
          <div className='text-center space-y-1'>
            <h1 className='text-2xl font-semibold'>Agam Space</h1>
            <p className='text-sm text-muted-foreground'>Private. Secure. Yours.</p>
          </div>

          <div className='border rounded-xl p-8 space-y-4 text-center bg-background'>
            <div className='mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-destructive'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold'>Invalid Invite Code</h2>
              <p className='text-sm text-muted-foreground'>{inviteError}</p>
            </div>
            <div className='pt-2'>
              <Link href='/login'>
                <Button variant='outline' className='w-full'>
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canSignup) {
    return (
      <div className='min-h-screen flex items-center justify-center px-4 bg-background text-foreground'>
        <div className='w-full max-w-md space-y-6'>
          <div className='text-center space-y-1'>
            <h1 className='text-2xl font-semibold'>Agam Space</h1>
            <p className='text-sm text-muted-foreground'>Private. Secure. Yours.</p>
          </div>

          <div className='border rounded-xl p-8 space-y-4 text-center bg-background'>
            <div className='mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-muted-foreground'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold'>Signup Unavailable</h2>
              <p className='text-sm text-muted-foreground'>
                New signups are currently not available.
              </p>
            </div>
            <div className='pt-2'>
              <Link href='/login'>
                <Button variant='outline' className='w-full'>
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
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
            <div className='text-primary text-3xl'>✓</div>
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
                autoComplete='username'
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
              {fieldErrors.username && (
                <p className='text-sm text-red-500'>{fieldErrors.username}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email {assignedEmail ? '(from invite)' : '(optional)'}</Label>
              <Input
                id='email'
                type='email'
                autoComplete='email'
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={!!assignedEmail}
                className={assignedEmail ? 'bg-muted cursor-not-allowed' : ''}
              />
              {fieldErrors.email && <p className='text-sm text-red-500'>{fieldErrors.email}</p>}
              {assignedEmail && (
                <p className='text-xs text-muted-foreground'>
                  This invite is assigned to this email address
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                autoComplete='new-password'
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              {fieldErrors.password && (
                <p className='text-sm text-destructive'>{fieldErrors.password}</p>
              )}
            </div>
            {inviteCode && inviteValid && (
              <div className='space-y-2'>
                <Label htmlFor='inviteCode'>Invite Code</Label>
                <Input
                  id='inviteCode'
                  value={inviteCode}
                  disabled
                  className='bg-muted cursor-not-allowed font-mono'
                />
                <p className='text-xs text-muted-foreground'>Using invite code to sign up</p>
              </div>
            )}

            <Button className='w-full' type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </Button>

            {error && <p className='text-sm text-destructive text-center'>{error}</p>}
          </form>
        )}
        {!success && ssoSignupEnabled && (
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
              Sign up with SSO
            </Button>
          </>
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
