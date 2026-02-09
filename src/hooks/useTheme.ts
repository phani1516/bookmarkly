import { useState, useEffect } from 'react';
import type { ThemeMode } from '@/lib/types';

const THEME_KEY = 'mindcache_theme';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return (stored === 'dark' ? 'dark' : 'light') as ThemeMode;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setThemeState(t => t === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme };
}
