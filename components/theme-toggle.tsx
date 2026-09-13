'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'akademya-theme';

/**
 * Theme toggle — the ONE new interactive element of the redesign, and it is
 * purely presentational: it flips data-theme on <html> and persists the
 * choice to localStorage. It reads no app state, dispatches nothing, and
 * wraps nothing. Initial paint is set by the synchronous head script in
 * app/layout.tsx; this component only syncs its icon to that value on mount.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTheme(
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
    );
  }, []);

  const flip = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private-mode storage denial — theme still applies for this session.
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
      title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-chip text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-primary"
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
