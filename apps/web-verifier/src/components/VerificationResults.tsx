import { Check, X, AlertCircle } from 'lucide-react';
import { VerificationResult } from '../types/manifest';

interface VerificationResultsProps {
  result: VerificationResult;
  onVerifyAnother: () => void;
}

export default function VerificationResults({ result, onVerifyAnother }: VerificationResultsProps) {
  const {
    authentic,
    version,
    commit,
    matchedFiles,
    modifiedFiles,
    missingFiles,
    totalFiles,
    steps,
  } = result;

  return (
    <div className='w-full max-w-4xl mx-auto animate-fade-in'>
      <div
        className={`glass-card rounded-2xl p-8 mb-6 ${
          authentic ? 'border-l-4 border-primary' : 'border-l-4 border-red-500'
        }`}
      >
        <div className='flex justify-center mb-6'>
          {authentic ? (
            <div className='w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center animate-check'>
              <Check className='w-12 h-12 text-primary' strokeWidth={3} />
            </div>
          ) : (
            <div className='w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center animate-check'>
              <X className='w-12 h-12 text-red-500' strokeWidth={3} />
            </div>
          )}
        </div>

        <h2
          className={`text-3xl font-bold text-center mb-2 ${
            authentic ? 'text-primary' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {authentic ? '✓ Instance Verified' : '⚠ Instance Modified'}
        </h2>

        <p className='text-center text-gray-600 dark:text-slate-400 mb-8'>
          {authentic
            ? "This instance is safe to use - it's running official Agam Space code"
            : 'Warning: This instance has been modified. Do NOT use it with sensitive data!'}
        </p>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <StatCard
            icon={<Check className='w-5 h-5' />}
            label='Verified Files'
            value={matchedFiles}
            color='green'
          />
          <StatCard
            icon={<AlertCircle className='w-5 h-5' />}
            label='Modified Files'
            value={modifiedFiles.length}
            color='red'
          />
          <StatCard
            icon={<AlertCircle className='w-5 h-5' />}
            label='Missing Files'
            value={missingFiles.length}
            color='yellow'
          />
        </div>

        <div className='bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm'>
          <InfoRow label='Version' value={version} />
          <InfoRow label='Commit' value={commit.substring(0, 8)} />
          <InfoRow label='Total Files' value={totalFiles.toString()} />
        </div>

        {/* Verification Steps */}
        {steps && steps.length > 0 && (
          <div className='mt-6'>
            <h3 className='text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-3'>
              Verification Steps
            </h3>
            <div className='space-y-2'>
              {steps.map((step, index) => (
                <div key={index} className='flex items-center gap-3 text-sm'>
                  <div className='flex-shrink-0'>
                    {step.status === 'success' && (
                      <div className='w-5 h-5 rounded-full bg-green-500 flex items-center justify-center'>
                        <Check className='w-3 h-3 text-white' strokeWidth={3} />
                      </div>
                    )}
                    {step.status === 'warning' && (
                      <div className='w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center'>
                        <AlertCircle className='w-3 h-3 text-white' strokeWidth={2} />
                      </div>
                    )}
                    {step.status === 'failed' && (
                      <div className='w-5 h-5 rounded-full bg-red-500 flex items-center justify-center'>
                        <X className='w-3 h-3 text-white' strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className='flex-1'>
                    <span className='font-medium text-gray-700 dark:text-slate-300'>
                      {step.name}:
                    </span>
                    <span className='text-gray-600 dark:text-slate-400 ml-1'>{step.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modifiedFiles.length > 0 && (
        <div className='glass-card rounded-2xl p-6 mb-6 animate-slide-up'>
          <h3 className='text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2'>
            <X className='w-6 h-6' />
            Modified Files ({modifiedFiles.length})
          </h3>
          <ul className='space-y-2'>
            {modifiedFiles.map(file => (
              <li
                key={file}
                className='flex items-center gap-2 text-gray-700 dark:text-slate-300 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded'
              >
                <X className='w-4 h-4 text-red-500 flex-shrink-0' />
                <code className='text-sm break-all'>{file}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingFiles.length > 0 && (
        <div className='glass-card rounded-2xl p-6 mb-6 animate-slide-up'>
          <h3 className='text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2'>
            <AlertCircle className='w-6 h-6' />
            Missing Files ({missingFiles.length})
          </h3>
          <ul className='space-y-2'>
            {missingFiles.map(file => (
              <li
                key={file}
                className='flex items-center gap-2 text-gray-700 dark:text-slate-300 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 rounded'
              >
                <AlertCircle className='w-4 h-4 text-yellow-500 flex-shrink-0' />
                <code className='text-sm break-all'>{file}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='flex justify-center gap-4'>
        <button onClick={onVerifyAnother} className='btn-primary'>
          Verify Another Instance
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'green' | 'red' | 'yellow';
}) {
  const colorClasses = {
    green:
      'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700/50',
    red: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700/50',
    yellow:
      'bg-yellow-50 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700/50',
  };

  return (
    <div
      className={`border-2 rounded-2xl p-6 ${colorClasses[color]} transform hover:scale-105 transition-transform duration-200`}
    >
      <div className='flex items-center gap-2 mb-3'>
        {icon}
        <span className='text-sm font-bold uppercase tracking-wide'>{label}</span>
      </div>
      <div className='text-4xl font-black'>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex justify-between items-center'>
      <span className='text-gray-600 dark:text-slate-400'>{label}:</span>
      <span className='font-mono font-semibold text-gray-900 dark:text-slate-200'>{value}</span>
    </div>
  );
}
