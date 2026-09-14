'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Root error boundary (mirrors the reference `ErrorComponent` in
 * `__root.tsx`). Rendered by Next.js when an uncaught error reaches the
 * root layout — it replaces the whole tree, so it must bring its own
 * <html>/<body> and cannot rely on the navbar, providers, or toasts.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-brand-bg">
        <div className="flex min-h-dvh items-center justify-center bg-brand-bg px-4">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-16 w-10 items-end justify-center overflow-hidden rounded-b-2xl rounded-t-md border-2 border-brand-accent/50" aria-hidden="true">
              <span className="block h-1/3 w-full bg-brand-accent/60" />
            </div>
            <p className="mt-5 font-mono text-xs uppercase tracking-widest text-brand-muted">Reaction unstable</p>
            <h1 className="mt-2 text-xl font-bold text-brand-text">حدث خطأ غير متوقع في التفاعل</h1>
            <p className="mt-2 text-sm text-brand-muted">
              لم تُكمل الصفحة تحميلها بشكل سليم. جرّب مرة أخرى أو ارجع للرئيسية.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
              >
                إعادة المحاولة
              </button>
              <Link
                href="/"
                className="rounded-full border border-brand-border-strong px-6 py-2.5 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-hover"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
