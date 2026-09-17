'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';

/**
 * PostHog analytics — STUDENT PAGES ONLY by design.
 *
 * The admin console (/admin/**) holds quiz answer keys, student grades, and
 * PII (Security Round 1 treats answerKey as paid-content secrets). We refuse
 * to let a third-party cloud see any of it:
 *
 *   - Landing directly on /admin  → posthog is never initialized → zero bytes.
 *   - SPA navigation /admin        → opt_out_capturing() + recording stop.
 *   - Leaving /admin               → capture re-enabled.
 *
 * Autocapture + session replay are on for student pages; inputs are masked
 * (password fields, etc.) so typed values never leave the browser.
 */
const isAdminPath = (path: string) => path === '/admin' || path.startsWith('/admin/');

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inited = useRef(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || typeof window === 'undefined') return;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (isAdminPath(pathname)) {
      if (inited.current) {
        posthog.opt_out_capturing();
      }
      return;
    }

    if (!inited.current) {
      posthog.init(key, {
        api_host: host,
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        session_recording: {
          maskAllInputs: true,
        },
      });
      inited.current = true;
    } else {
      posthog.opt_in_capturing();
    }
  }, [pathname]);

  return <>{children}</>;
}