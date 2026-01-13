import { useState } from 'react';
import { ArrowRight, AlertCircle, Copy, Clipboard } from 'lucide-react';

interface VerifyFormProps {
  onVerify: (url: string, version?: string, manifestHtml?: string) => void;
  isLoading: boolean;
  initialUrl?: string;
}

export default function VerifyForm({ onVerify, isLoading, initialUrl = '' }: VerifyFormProps) {
  const [tab, setTab] = useState<'url' | 'paste'>('url');
  const [url, setUrl] = useState(initialUrl);
  const [manifestHtml, setManifestHtml] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'url') {
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
    } else {
      if (!manifestHtml.trim()) {
        setError('Please paste the integrity manifest HTML');
        return;
      }

      onVerify('', undefined, manifestHtml);
    }
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

        {/* Tabs */}
        <div className='flex gap-0 mb-6 border-b border-gray-200 dark:border-slate-700'>
          <button
            type='button'
            onClick={() => {
              setTab('url');
              setError('');
            }}
            className={`flex-1 px-4 py-2 font-semibold text-sm transition-colors text-center ${
              tab === 'url'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            Verify URL
          </button>
          <button
            type='button'
            onClick={() => {
              setTab('paste');
              setError('');
            }}
            className={`flex-1 px-4 py-2 font-semibold text-sm transition-colors text-center ${
              tab === 'paste'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            Paste HTML
          </button>
        </div>

        {/* URL Tab */}
        {tab === 'url' && (
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
        )}

        {/* Paste Tab */}
        {tab === 'paste' && (
          <div className='mb-5'>
            <label
              htmlFor='manifest'
              className='block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2'
            >
              HTML Page Content
            </label>
            <textarea
              id='manifest'
              value={manifestHtml}
              onChange={e => setManifestHtml(e.target.value)}
              placeholder='Paste the complete HTML page here...'
              className='input-field min-h-40 font-mono text-xs'
              disabled={isLoading}
            />
            <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 rounded-lg'>
              <p className='text-xs text-blue-800 dark:text-blue-300 font-semibold mb-1'>
                How to use:
              </p>
              <ol className='text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside'>
                <li>Open your Agam Space instance in the browser</li>
                <li>Right-click → Select all (Ctrl+A)</li>
                <li>Copy the entire page (Ctrl+C)</li>
                <li>Paste it here and click "Verify Instance"</li>
              </ol>
            </div>
          </div>
        )}

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
