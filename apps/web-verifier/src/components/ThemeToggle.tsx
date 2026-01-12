import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className='fixed top-4 right-4 z-50 p-3 rounded-full bg-white/80 dark:bg-slate-800/80
                 backdrop-blur-sm border-2 border-gray-200 dark:border-slate-600
                 hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-xl
                 group'
      aria-label='Toggle dark mode'
    >
      {isDark ? (
        <Sun className='w-5 h-5 text-yellow-500 group-hover:rotate-90 transition-transform duration-300' />
      ) : (
        <Moon className='w-5 h-5 text-slate-700 group-hover:-rotate-12 transition-transform duration-300' />
      )}
    </button>
  );
}
