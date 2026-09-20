'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'akademya-theme';

/**
 * Theme toggle — the ONE new interactive element of the redesign, and it is
 * purely presentational: it flips data-theme on <html> and persists the
 * choice to localStorage. It reads no app state, dispatches nothing, and
 * wraps nothing. Initial paint is set by the synchronous head script in
 * app/layout.tsx; this component only syncs its icon to that value on mount.
 * Markup/classes/SVGs mirror the reference implementation verbatim.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggle() {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private-mode storage denial — theme still applies for this session.
    }
    setIsDark(!isDark);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      className={
        // h-9/w-9 + rounded-full mirrors NotificationBell so the two chips read
        // as one cluster. Tailwind v4 dropped the default button cursor, so
        // `cursor-pointer` and the hover/active states are what make it feel
        // (and read) clickable.
        'grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-brand-border bg-brand-surface/60 text-brand-muted-strong transition duration-200 hover:border-brand-primary/40 hover:bg-brand-chip hover:text-brand-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 ' +
        className
      }
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
