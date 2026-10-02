'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ListChecks,
  GraduationCap,
  FileCheck2,
  FlaskConical,
  ExternalLink,
  LogOut,
  Bell,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { logoutUser } from '@/services/authService';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; feature?: 'notifications' | 'aiGrader' }[] }[] = [
  {
    label: 'عام',
    items: [{ href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard }],
  },
  {
    label: 'الإدارة',
    items: [
      { href: '/admin/students', label: 'الطلاب', icon: Users },
      { href: '/admin/courses', label: 'الدورات والفيديوهات', icon: BookOpen },
      { href: '/admin/enrollments', label: 'الاشتراكات والتسجيلات', icon: GraduationCap },
      { href: '/admin/notifications', label: 'الإشعارات', icon: Bell, feature: 'notifications' as const },
    ],
  },
  {
    label: 'التقييم والامتحانات',
    items: [
      { href: '/admin/quizzes', label: 'الاختبارات', icon: ListChecks },
      { href: '/admin/grading', label: 'تصحيح المقالي', icon: FileCheck2 },
    ],
  },
  {
    // Group label + item label taken from the design's sidebar nav grouping
    // ("الذكاء الاصطناعي" / "المساعد الإداري"). The design's rewritten sidebar
    // is NOT ported — this reuses the existing item markup above (lucide icon,
    // 13px, rounded-lg, #e8f2ff active pill), and lucide replaces the design's
    // icon-less rows because every existing item here has an icon.
    label: 'الذكاء الاصطناعي',
    items: [{ href: '/admin/agent', label: 'المساعد الإداري', icon: Sparkles }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void } = {}) {
  const pathname = usePathname();
  const user = useAppSelector(selectUser);

  // Escape closes the mobile drawer; desktop aside is unaffected.

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseMobile?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {/* Mobile drawer: literal design geometry (inset-y-0, start-0, w-64, z-50,
          translate-x-full closed in RTL) with overlay below it at z-40.
          Desktop aside below is unchanged. */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
        />
      )}
      <div
        id="admin-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="قائمة لوحة التحكم"
        className={
          'fixed inset-y-0 start-0 z-50 flex h-dvh w-64 shrink-0 flex-col border-s border-brand-border bg-brand-surface transition-transform duration-300 lg:hidden ' +
          (mobileOpen ? 'translate-x-0 visible' : 'invisible translate-x-full')
        }
        aria-hidden={mobileOpen ? undefined : true}
      >
        <div className="flex items-center gap-2.5 border-b border-brand-border px-5 py-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-primary text-white">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 5.5C6.5 4.2 9 4 12 5v14c-3-1-5.5-.8-8 .5V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M20 5.5C17.5 4.2 15 4 12 5v14c3-1 5.5-.8 8 .5V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-brand-text">لوحة التحكم</p>
            <p className="text-xs text-brand-muted">أكاديميا الكيمياء</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="إغلاق القائمة"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-brand-muted transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="تنقل لوحة التحكم" className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={`mobile-${group.label}`} className="mb-5">
              <p className="mb-2 px-2 text-xs font-bold text-brand-muted">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  if (item.feature && user?.features?.[item.feature] === false) return null;
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={`mobile-${item.href}`}
                      href={item.href}
                      onClick={onCloseMobile}
                      aria-current={active ? 'page' : undefined}
                      className={
                        'flex items-center rounded-lg border-s-2 px-3 py-2 text-sm font-medium transition ' +
                        (active
                          ? 'border-s-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-s-transparent text-brand-muted-strong hover:bg-brand-hover')
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-brand-border px-4 py-4">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-brand-muted transition-colors hover:text-brand-primary"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            الرجوع للبوابة الرئيسية
          </Link>
          <div className="flex items-center gap-2.5 rounded-lg bg-brand-chip px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-accent text-xs font-bold text-white">
              {user?.name?.trim()?.charAt(0) || 'أ'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-brand-text">{user?.name ?? 'مدير الموقع'}</p>
              <p className="truncate text-[11px] text-brand-muted" dir="ltr">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-brand-border bg-brand-surface lg:flex">
      {/* Brand & Theme */}
      <div className="flex h-16 items-center justify-between border-b border-brand-border px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white">
            <FlaskConical className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-text">لوحة التحكم</p>
            <p className="truncate text-[11px] text-brand-muted">أكاديمية الكيمياء</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                if (item.feature && user?.features?.[item.feature] === false) return null;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
                        active
                          ? 'border-s-2 border-s-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-s-2 border-s-transparent text-brand-muted-strong hover:bg-brand-hover hover:text-brand-text',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Back to portal + version */}
      <div className="border-t border-brand-border px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-brand-muted-strong transition-colors duration-150 hover:bg-brand-hover hover:text-brand-primary"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>الرجوع للبوابة الرئيسية</span>
        </Link>
        <p className="mt-2 px-3 text-[11px] text-brand-muted">الإصدار 2.4.0</p>
      </div>

      {/* User chip */}
      <div className="border-t border-brand-border p-3">
        <div className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-chip px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-xs font-bold text-brand-primary">
            {user?.name?.trim()?.charAt(0) || 'أ'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-brand-text">{user?.name}</p>
            <p className="truncate text-[11px] text-brand-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => logoutUser()}
            title="تسجيل الخروج"
            className="cursor-pointer rounded-md p-1.5 text-brand-muted transition-colors duration-150 hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
