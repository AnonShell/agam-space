'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type ThemeOption = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeOption>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as ThemeOption | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const resolveTheme = (t: ThemeOption | null): ThemeOption => {
      if (!t || t === 'system') return prefersDark.matches ? 'dark' : 'light';
      return t;
    };

    const resolved = resolveTheme(stored);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    setTheme(stored ?? 'system');

    const listener = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme') === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    prefersDark.addEventListener('change', listener);
    return () => prefersDark.removeEventListener('change', listener);
  }, []);

  const cycleTheme = () => {
    const next: ThemeOption =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

    localStorage.setItem('theme', next);
    setTheme(next);

    if (next === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
  };

  const Icon = theme === 'light' ? <Moon className="w-5 h-5" /> :
    theme === 'dark' ? <Sun className="w-5 h-5" /> :
      <Laptop className="w-5 h-5" />;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={cycleTheme}>
            {Icon}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
