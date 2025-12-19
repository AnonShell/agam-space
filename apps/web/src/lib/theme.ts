export function applyThemeFromLocalStorage() {
  const stored = localStorage.getItem('theme'); // may be 'light', 'dark', or 'system'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const shouldUseDark = stored === 'dark' || ((stored === 'system' || !stored) && prefersDark);

  document.documentElement.classList.toggle('dark', shouldUseDark);
}
