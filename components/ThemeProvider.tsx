'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'dresy-theme';

export type Theme = 'light' | 'dark';

function resolveThemeFromStorage(stored: string | null): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const theme = resolveThemeFromStorage(localStorage.getItem(STORAGE_KEY));
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return <>{children}</>;
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return resolveThemeFromStorage(localStorage.getItem(STORAGE_KEY));
}
