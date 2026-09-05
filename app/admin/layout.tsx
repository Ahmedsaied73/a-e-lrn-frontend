'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';

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

  return <>{children}</>;
}