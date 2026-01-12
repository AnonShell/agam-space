import { useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface VerifyFormProps {
  onVerify: (url: string, version?: string) => void;
  isLoading: boolean;
  initialUrl?: string;
}

export default function VerifyForm({ onVerify, isLoading, initialUrl = '' }: VerifyFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter an instance URL');
      return;
    }

    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    onVerify(normalizedUrl);
  };

  return (
    <div className='w-full max-w-3xl mx-auto'>
      <form
        onSubmit={handleSubmit}
        className='glass-card rounded-3xl pt-4 px-8 pb-8 md:pt-6 md:px-10 md:pb-10 animate-slide-up border-2 border-white/60 dark:border-slate-700/60'
      >
        <div className='text-center mb-6'>
          <h2 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2'>
            Verify Web Assets
          </h2>
          <p className='text-sm text-gray-600 dark:text-slate-400'>
            Complete verification of all frontend code (HTML, CSS, JavaScript)
          </p>
        </div>

        <div className='mb-5'>
          <label
            htmlFor='url'
            className='block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2'
          >
            Instance URL
          </label>
          <input
            id='url'
            type='text'
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder='https://agam.example.com'
            className='input-field'
            disabled={isLoading}
          />
          <p className='text-xs text-gray-500 dark:text-slate-400 mt-2'>
            Enter the full URL of the Agam Space instance
          </p>
        </div>

        {error && (
          <div className='mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700/50 rounded-xl px-4 py-3'>
            <AlertCircle className='w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-semibold text-red-800 dark:text-red-400'>Error</p>
              <p className='text-sm text-red-700 dark:text-red-300'>{error}</p>
            </div>
          </div>
        )}

        <button
          type='submit'
          disabled={isLoading}
          className='btn-primary w-full flex items-center justify-center gap-2'
        >
          {isLoading ? (
            <>
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              Verifying...
            </>
          ) : (
            <>
              Verify Instance
              <ArrowRight className='w-5 h-5' />
            </>
          )}
        </button>

        <div className='mt-6 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/20 dark:border-primary/30 rounded-xl p-4'>
          <div className='flex items-start gap-3'>
            <div className='w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0'>
              <span className='text-primary text-lg'>ℹ️</span>
            </div>
            <div>
              <h3 className='text-sm font-bold text-primary mb-1'>Complete Verification</h3>
              <p className='text-sm text-gray-700 dark:text-slate-300 leading-relaxed'>
                We verify ALL HTML files, all JavaScript, and all CSS files against the official
                Agam Space release manifest.
              </p>
              <p className='text-xs text-gray-600 dark:text-slate-400 mt-2'>
                <strong>Required:</strong> Instance must have{' '}
                <code className='bg-gray-200 dark:bg-slate-700 px-1 rounded'>
                  ALLOW_CORS_FOR_INTEGRITY_VERIFICATION=true
                </code>{' '}
                (enabled by default).
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
