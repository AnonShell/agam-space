type ThemeOption = 'light' | 'dark' | 'system';

export class ThemeService {
  private static readonly THEME_KEY = 'theme';

  static getStoredTheme(): ThemeOption | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.THEME_KEY) as ThemeOption | null;
  }

  static getSystemPreference(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  static resolveTheme(theme: ThemeOption | null): 'light' | 'dark' {
    if (!theme || theme === 'system') {
      return this.getSystemPreference();
    }
    return theme;
  }

  static getCurrentTheme(): ThemeOption {
    const stored = this.getStoredTheme();
    return stored ?? 'system';
  }

  static setTheme(theme: ThemeOption): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.THEME_KEY, theme);
    const resolved = this.resolveTheme(theme);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }

  static applyTheme(theme: ThemeOption): void {
    const resolved = this.resolveTheme(theme);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }

  static onSystemPreferenceChange(callback: (isDark: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      if (this.getCurrentTheme() === 'system') {
        callback(e.matches);
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }

  static getNextTheme(current: ThemeOption): ThemeOption {
    switch (current) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'system';
      case 'system':
        return 'light';
    }
  }
}
