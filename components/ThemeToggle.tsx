'use client';

import { useEffect } from 'react';
import { setTheme } from './ThemeProvider';

export default function ThemeToggle() {
  useEffect(() => {
    // Light mode is intentionally disabled; keep the app in dark mode.
    setTheme('dark');
  }, []);

  return null;
}
