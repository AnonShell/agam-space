import { Github, FileText, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className='w-full py-6 mt-12 border-t border-white/50 dark:border-slate-700/50 backdrop-blur-sm bg-white/20 dark:bg-slate-800/20'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='text-center md:text-left'>
            <p className='text-xs text-gray-600 dark:text-slate-400'>
              Part of Agam Space · Built with{' '}
              <Heart className='w-3 h-3 text-red-500 fill-red-500 inline' /> for security.
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <a
              href='https://github.com/agam-space/agam-space'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary-light transition-colors rounded-lg hover:bg-white/40 dark:hover:bg-slate-700/40'
            >
              <Github className='w-4 h-4' />
              GitHub
            </a>
            <a
              href='https://docs.agamspace.app/security/web-assets-integrity-verification'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary-light transition-colors rounded-lg hover:bg-white/40 dark:hover:bg-slate-700/40'
            >
              <FileText className='w-4 h-4' />
              Docs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
