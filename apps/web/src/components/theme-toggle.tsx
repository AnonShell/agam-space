'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ThemeService } from '@/services/theme.service';

type ThemeOption = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeOption>('system');

  useEffect(() => {
    setTheme(ThemeService.getCurrentTheme());
    ThemeService.applyTheme(ThemeService.getCurrentTheme());

    const unsubscribe = ThemeService.onSystemPreferenceChange(isDark => {
      document.documentElement.classList.toggle('dark', isDark);
    });

    return unsubscribe;
  }, []);

  const cycleTheme = () => {
    const next = ThemeService.getNextTheme(theme);
    ThemeService.setTheme(next);
    setTheme(next);
  };

  const Icon =
    theme === 'light' ? (
      <Moon className='w-5 h-5' />
    ) : theme === 'dark' ? (
      <Sun className='w-5 h-5' />
    ) : (
      <Laptop className='w-5 h-5' />
    );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='ghost' size='icon' onClick={cycleTheme}>
            {Icon}
            <span className='sr-only'>Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>
          {`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
