import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-bg px-4">
      <div className="mx-auto max-w-sm text-center">
        <svg width="120" height="72" viewBox="0 0 120 72" fill="none" className="mx-auto text-brand-primary" aria-hidden="true">
          <circle cx="26" cy="36" r="16" stroke="currentColor" strokeWidth="2" />
          <circle cx="94" cy="36" r="16" stroke="currentColor" strokeWidth="2" className="text-brand-accent" />
          <path d="M46 30 58 24M46 42 58 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-muted" />
          <path d="M62 24 74 30M62 48 74 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-muted" />
        </svg>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-brand-muted">Bond not found</p>
        <h1 className="mt-2 text-xl font-bold text-brand-text">هذا الرابط انفصل عن الجزيء</h1>
        <p className="mt-2 text-sm text-brand-muted">الصفحة التي تبحث عنها غير متاحة أو تم نقلها إلى مكان آخر.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90">
            العودة للرئيسية
          </Link>
          <Link href="/grades/1" className="text-sm font-semibold text-brand-muted-strong hover:text-brand-primary">
            تصفح الدورات
          </Link>
        </div>
      </div>
    </div>
  );
}
