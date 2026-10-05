'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AgentLauncher } from '@/components/admin/AgentLauncher';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, initialized, user } = useSelector(selectAuth);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!user || user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [initialized, isAuthenticated, user, router]);

  if (!initialized || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
        جارٍ التحقق من الصلاحيات...
      </main>
    );
  }

  return (
    // -mt-16 reclaims the global <main> pt-16 so the console fills the viewport.
    <div className="-mt-16 flex min-h-dvh bg-brand-bg text-brand-text" dir="rtl">
      <AdminSidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        {/* Literal design mobile header: sticky top-0 z-30 hamburger + title + theme toggle */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-border bg-brand-surface px-3 py-2 sm:px-4 sm:py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="القائمة"
              aria-expanded={mobileNavOpen}
              aria-controls="admin-mobile-drawer"
              className="grid h-9 w-9 place-items-center rounded-lg border border-brand-border text-brand-muted-strong transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </button>
            <span className="text-sm font-extrabold text-brand-text">لوحة التحكم</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="pb-16 lg:pb-0">{children}</main>
      </div>
      <AgentLauncher />
    </div>
  );
}