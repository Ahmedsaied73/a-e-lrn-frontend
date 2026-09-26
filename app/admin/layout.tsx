'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileHeader, AdminMobileNav } from '@/components/admin/MobileShell';
import { AgentLauncher } from '@/components/admin/AgentLauncher';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, initialized, user } = useSelector(selectAuth);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [initialized, isAuthenticated, user, router]);

  if (!initialized || !isAuthenticated || (user && user.role !== 'ADMIN')) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
        جارٍ التحقق من الصلاحيات...
      </main>
    );
  }

  return (
    // -mt-16 reclaims the global <main> pt-16 so the console fills the viewport.
    <div className="-mt-16 flex min-h-screen bg-[#f7f9fc]">
      <AdminSidebar />
      <div className="min-w-0 flex-1 overflow-hidden pt-16 lg:pt-0">
        <AdminMobileHeader />
        <main className="pb-24 lg:pb-0">{children}</main>
        <AdminMobileNav />
      </div>
      {/* Floating admin agent (FAB + panel), ported from the design's admin.tsx,
          which mounts it as the last child of the admin shell root. It is
          fixed-position, so it lives outside the content column. */}
      <AgentLauncher />
    </div>
  );
}