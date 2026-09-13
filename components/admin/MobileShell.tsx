'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ClipboardCheck, LayoutDashboard, School, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdminDashboard } from '@/services/adminDashboardService';

const NAV_ITEMS: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/students', label: 'الطلاب', icon: Users },
  { href: '/admin/courses', label: 'المقررات', icon: School },
  { href: '/admin/grading', label: 'التصحيح', icon: ClipboardCheck },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function AdminMobileHeader() {
  return (
    <header className="pt-safe fixed top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/80 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary">
            <User className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="max-w-[170px] truncate text-sm font-bold text-on-surface">أكاديمية الكيمياء</span>
            <span className="text-caption leading-none text-on-surface-variant">لوحة التحكم</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="الإشعارات"
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
        >
          <Bell className="h-6 w-6" aria-hidden="true" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface" />
        </button>
      </div>
    </header>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [gradingCount, setGradingCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminDashboard()
      .then((d) => {
        if (!cancelled) setGradingCount(d.counts.attempts.GRADING ?? 0);
      })
      .catch(() => {
        if (!cancelled) setGradingCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="pb-safe fixed bottom-0 z-50 w-full border-t border-outline-variant/40 bg-surface/85 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:hidden"
    >
      <div className="flex items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[44px] min-w-xl flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                active ? 'text-[#0057c0]' : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              <span className="relative flex items-center justify-center">
                <item.icon className="h-6 w-6" aria-hidden="true" />
                {item.href === '/admin/grading' && typeof gradingCount === 'number' && gradingCount > 0 && (
                  <span className="absolute -left-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-on-error">
                    {gradingCount > 9 ? '9+' : gradingCount}
                  </span>
                )}
              </span>
              <span className={cn('text-[11px]', active && 'font-bold')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}