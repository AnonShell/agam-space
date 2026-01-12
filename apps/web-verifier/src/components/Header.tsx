import Image from 'next/image';
import { Lock, CheckCircle, Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className='w-full py-4 mb-0'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='text-center'>
          <div className='flex items-center justify-center gap-3 mb-2'>
            <div className='relative'>
              <div className='absolute inset-0 bg-primary/20 dark:bg-primary/30 blur-xl rounded-full'></div>
              <div className='relative w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-xl p-2'>
                <Image
                  src='/favicon.svg'
                  alt='Agam Space Logo'
                  width={28}
                  height={28}
                  className='w-full h-full'
                />
              </div>
            </div>

            <h1 className='text-2xl md:text-3xl font-black'>
              <span className='text-primary'>Agam Space</span>
            </h1>
          </div>

          <p className='text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4'>
            Web Verifier
          </p>

          <div className='flex flex-wrap justify-center gap-3'>
            <FeatureBadge
              icon={<Shield className='w-4 h-4' />}
              text="Check instances you're using"
            />
            <FeatureBadge
              icon={<CheckCircle className='w-4 h-4' />}
              text='Integrity verification'
            />
            <FeatureBadge icon={<Lock className='w-4 h-4' />} text='Detect tampering' />
          </div>
        </div>
      </div>
    </header>
  );
}

function FeatureBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className='flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-700/60
                    backdrop-blur-sm rounded-full border border-primary/20 dark:border-primary/30
                    shadow-sm'
    >
      <div className='text-primary'>{icon}</div>
      <span className='text-sm font-semibold text-gray-700 dark:text-slate-200'>{text}</span>
    </div>
  );
}
