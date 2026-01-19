'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_MIGRATIONS, MigrationRunner } from '@/lib/migrations';

interface MigrationRunnerPageProps {
  redirectTo: string;
}

export function MigrationRunnerPage({ redirectTo }: MigrationRunnerPageProps) {
  const router = useRouter();
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const runMigrations = async () => {
      try {
        // Give UI time to render the migration dialog
        await new Promise(resolve => setTimeout(resolve, 1000));

        await MigrationRunner.runPending(ALL_MIGRATIONS, description => {
          setDescription(description);
        });

        setSuccess(true);

        setTimeout(() => {
          router.replace(redirectTo);
        }, 2000);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    runMigrations();
  }, [router, redirectTo]);

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-slate-950 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden'>
        {error ? (
          <div className='p-12'>
            <div className='flex flex-col items-center gap-6'>
              <div className='rounded-full bg-red-100 dark:bg-red-950 p-4'>
                <svg
                  className='w-12 h-12 text-red-600 dark:text-red-400'
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
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-red-600 dark:text-red-400 mb-2'>
                  Migration Failed
                </h2>
                <p className='text-gray-600 dark:text-gray-400 text-sm mb-6'>{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className='w-full px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white font-semibold rounded-lg transition-colors'
              >
                Retry Migration
              </button>
            </div>
          </div>
        ) : success ? (
          <div className='p-12'>
            <div className='flex flex-col items-center gap-6'>
              <div className='rounded-full bg-green-100 dark:bg-green-950 p-4'>
                <svg
                  className='w-10 h-10 text-green-600 dark:text-green-400'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                  Migration Complete
                </h2>
                <p className='text-gray-600 dark:text-gray-400'>
                  All migrations have been applied successfully
                </p>
              </div>
              <div className='w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                <div className='h-full bg-green-600 dark:bg-green-500 animate-pulse'></div>
              </div>
              <p className='text-sm text-gray-500 dark:text-gray-400'>Redirecting you now...</p>
            </div>
          </div>
        ) : (
          <div className='p-12'>
            <div className='flex flex-col items-center gap-8'>
              <div className='rounded-full bg-blue-100 dark:bg-blue-950 p-4'>
                <div className='w-10 h-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin'></div>
              </div>
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                  Migration in Progress
                </h2>
                <p className='text-gray-600 dark:text-gray-400 mb-4'>
                  {description || 'Preparing system upgrade...'}
                </p>
                <p className='text-sm text-gray-500 dark:text-gray-500'>
                  This may take a moment. Please don't close this window.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
