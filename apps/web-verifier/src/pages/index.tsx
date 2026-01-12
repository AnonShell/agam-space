import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VerifyForm from '../components/VerifyForm';
import LoadingScreen from '../components/LoadingScreen';
import VerificationResults from '../components/VerificationResults';
import ThemeToggle from '../components/ThemeToggle';
import { verifyInstance } from '../lib/verifier';
import { VerificationResult, VerificationStep } from '../types/manifest';

type ViewState = 'form' | 'loading' | 'results' | 'error';

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>('form');
  const [loadingStatus, setLoadingStatus] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [errorSteps, setErrorSteps] = useState<VerificationStep[]>([]);
  const [lastUrl, setLastUrl] = useState('');

  const handleVerify = async (url: string, version?: string) => {
    setLastUrl(url);
    setViewState('loading');
    setLoadingStatus('Fetching instance...');

    try {
      setTimeout(() => setLoadingStatus('Verifying HTML files...'), 500);
      setTimeout(() => setLoadingStatus('Downloading official manifest...'), 1500);
      setTimeout(() => setLoadingStatus('Comparing hashes...'), 2500);

      const verificationResult = await verifyInstance(url, version);

      setResult(verificationResult);
      setViewState('results');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'steps' in err) {
        const errorWithSteps = err as { steps?: VerificationStep[]; message?: string };
        setErrorSteps(errorWithSteps.steps || []);
        setError(errorWithSteps.message || 'Verification failed');
      } else {
        setErrorSteps([]);
        setError(err instanceof Error ? err.message : 'Verification failed');
      }
      setViewState('error');
    }
  };

  const handleReset = () => {
    setViewState('form');
    setError('');
    setErrorSteps([]);
  };

  const handleRetry = () => {
    if (lastUrl) {
      handleVerify(lastUrl);
    }
  };

  return (
    <>
      <Head>
        <title>Agam Space Web Verifier</title>
      </Head>

      <ThemeToggle />

      <div className='min-h-screen flex flex-col'>
        <Header />
        <main className='flex-1 w-full max-w-6xl mx-auto px-4 py-4'>
          {viewState === 'form' && (
            <>
              <VerifyForm onVerify={handleVerify} isLoading={false} initialUrl={lastUrl} />

              <div className='mt-12 max-w-4xl mx-auto'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-slate-100 text-center mb-8'>
                  How Verification Works
                </h2>

                <div className='grid md:grid-cols-2 gap-6'>
                  <div className='glass-card rounded-2xl p-6'>
                    <div className='w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4'>
                      <span className='text-2xl'>🔍</span>
                    </div>
                    <h3 className='text-lg font-bold text-gray-900 dark:text-slate-100 mb-2'>
                      What We Verify
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-slate-400 leading-relaxed'>
                      We check that all JavaScript and CSS files loaded by the instance match the
                      official Agam Space releases. Each file has a hash that proves it hasn't been
                      modified.
                    </p>
                  </div>

                  <div className='glass-card rounded-2xl p-6'>
                    <div className='w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4'>
                      <span className='text-2xl'>🔒</span>
                    </div>
                    <h3 className='text-lg font-bold text-gray-900 dark:text-slate-100 mb-2'>
                      Hash Verification
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-slate-400 leading-relaxed'>
                      We use SHA-384 hashes embedded in the HTML to verify files. These hashes are
                      compared against the official manifest published in GitHub releases, ensuring
                      authenticity.
                    </p>
                  </div>

                  <div className='glass-card rounded-2xl p-6'>
                    <div className='w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4'>
                      <span className='text-2xl'>⚙️</span>
                    </div>
                    <h3 className='text-lg font-bold text-gray-900 dark:text-slate-100 mb-2'>
                      The Process
                    </h3>
                    <ol className='text-sm text-gray-600 dark:text-slate-400 space-y-2 list-decimal list-inside'>
                      <li>Extract version from instance HTML</li>
                      <li>Fetch official manifest from GitHub</li>
                      <li>Compare all file hashes</li>
                      <li>Report any mismatches</li>
                    </ol>
                  </div>

                  <div className='glass-card rounded-2xl p-6'>
                    <div className='w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4'>
                      <span className='text-2xl'>🛡️</span>
                    </div>
                    <h3 className='text-lg font-bold text-gray-900 dark:text-slate-100 mb-2'>
                      What This Detects
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-slate-400 leading-relaxed'>
                      Detects if the frontend code (HTML, CSS, JavaScript) has been modified. This
                      includes changes to encryption logic, UI tampering, or injected scripts in the
                      client code.
                    </p>
                  </div>
                </div>

                <div className='mt-8 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-700/50 rounded-2xl p-6'>
                  <h3 className='text-lg font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2'>
                    <span className='text-xl'>✓</span>
                    Complete Verification
                  </h3>
                  <div className='space-y-3 text-sm text-blue-800 dark:text-blue-300'>
                    <p>
                      <strong>What we verify:</strong>
                    </p>
                    <ul className='list-disc list-inside space-y-1 ml-2'>
                      <li>ALL HTML files (root, explorer, settings routes)</li>
                      <li>All JavaScript files with SRI hashes</li>
                      <li>All CSS files with SRI hashes</li>
                    </ul>
                    <p className='mt-3'>
                      <strong>NOT verified:</strong>
                    </p>
                    <ul className='list-disc list-inside space-y-1 ml-2'>
                      <li>Server-side code or API behavior</li>
                      <li>Database or server configuration</li>
                    </ul>
                    <p className='mt-3 font-semibold'>
                      ✅ Complete frontend integrity verification ensures no code has been tampered
                      with.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {viewState === 'loading' && <LoadingScreen status={loadingStatus} />}

          {viewState === 'results' && result && (
            <VerificationResults result={result} onVerifyAnother={handleReset} />
          )}

          {viewState === 'error' && (
            <div className='w-full max-w-3xl mx-auto'>
              <div className='glass-card rounded-3xl p-8 animate-slide-up'>
                <div className='text-center mb-8'>
                  <div className='w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4'>
                    <span className='text-4xl'>❌</span>
                  </div>
                  <h2 className='text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2'>
                    Verification Failed
                  </h2>
                  <p className='text-gray-600 dark:text-slate-400'>{error}</p>
                </div>

                {errorSteps.length > 0 && (
                  <div className='space-y-3 mb-8'>
                    <h3 className='text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-4'>
                      Verification Steps
                    </h3>
                    {errorSteps.map((step, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 ${
                          step.status === 'success'
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50'
                            : step.status === 'warning'
                              ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700/50'
                              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50'
                        }`}
                      >
                        <div className='shrink-0 mt-0.5'>
                          {step.status === 'success' && (
                            <div className='w-6 h-6 rounded-full bg-green-500 flex items-center justify-center'>
                              <svg
                                className='w-4 h-4 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={3}
                                  d='M5 13l4 4L19 7'
                                />
                              </svg>
                            </div>
                          )}
                          {step.status === 'warning' && (
                            <div className='w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center'>
                              <svg
                                className='w-4 h-4 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                />
                              </svg>
                            </div>
                          )}
                          {step.status === 'failed' && (
                            <div className='w-6 h-6 rounded-full bg-red-500 flex items-center justify-center'>
                              <svg
                                className='w-4 h-4 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={3}
                                  d='M6 18L18 6M6 6l12 12'
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p
                            className={`text-sm font-bold mb-1 ${
                              step.status === 'success'
                                ? 'text-green-900 dark:text-green-300'
                                : step.status === 'warning'
                                  ? 'text-yellow-900 dark:text-yellow-300'
                                  : 'text-red-900 dark:text-red-300'
                            }`}
                          >
                            {step.name}
                          </p>
                          <p
                            className={`text-sm ${
                              step.status === 'success'
                                ? 'text-green-700 dark:text-green-400'
                                : step.status === 'warning'
                                  ? 'text-yellow-700 dark:text-yellow-400'
                                  : 'text-red-700 dark:text-red-400'
                            }`}
                          >
                            {step.message}
                          </p>
                          {step.details && (
                            <p
                              className={`text-xs mt-2 ${
                                step.status === 'success'
                                  ? 'text-green-600 dark:text-green-500'
                                  : step.status === 'warning'
                                    ? 'text-yellow-600 dark:text-yellow-500'
                                    : 'text-red-600 dark:text-red-500'
                              }`}
                            >
                              {step.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className='flex flex-col sm:flex-row gap-3'>
                  <button
                    onClick={handleRetry}
                    className='btn-primary flex-1 flex items-center justify-center gap-2'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                      />
                    </svg>
                    Try Again
                  </button>
                  <button
                    onClick={handleReset}
                    className='flex-1 px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-xl transition-colors'
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
