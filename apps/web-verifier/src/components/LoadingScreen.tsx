import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  status: string;
}

export default function LoadingScreen({ status }: LoadingScreenProps) {
  return (
    <div className='w-full max-w-3xl mx-auto'>
      <div className='glass-card rounded-3xl p-12 animate-fade-in border-2 border-white/60 dark:border-slate-700/60'>
        <div className='flex flex-col items-center gap-6'>
          <div className='relative'>
            <div className='w-20 h-20 rounded-full border-4 border-primary/20'></div>
            <div className='absolute inset-0 w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin'></div>
            <Loader2 className='absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse' />
          </div>

          <div className='text-center'>
            <h2 className='text-3xl font-bold text-primary mb-2'>Verifying Instance</h2>
            <p className='text-lg text-gray-600 dark:text-slate-400 animate-pulse'>{status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
