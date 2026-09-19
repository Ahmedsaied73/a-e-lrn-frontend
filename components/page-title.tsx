'use client';

import { useEffect } from 'react';

/**
 * Sets document.title for client-rendered pages, which cannot export Next
 * `metadata`. Titles come from lib/page-titles.ts so every page stays unique.
 * Renders nothing.
 */
export function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
