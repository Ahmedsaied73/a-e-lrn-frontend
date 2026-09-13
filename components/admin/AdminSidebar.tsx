'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { logoutUser } from '@/services/authService';

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
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const user = useAppSelector(selectUser);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-outline-variant/70 bg-white lg:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-outline-variant/70 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f2ff] text-primary-color">
          <FlaskConical className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-on-surface">لوحة التحكم</p>
          <p className="truncate text-[11px] text-on-surface-variant">أكاديمية الكيمياء</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                // Feature-gated links disappear entirely when the backend says off.
                if (item.feature && user?.features?.[item.feature] === false) return null;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
                        active
                          ? 'bg-[#e8f2ff] text-[#0057c0]'
                          : 'text-on-surface-variant hover:bg-[#e8f2ff]/50 hover:text-[#0057c0]',
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
      <div className="border-t border-outline-variant/70 px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-on-surface-variant transition-colors duration-150 hover:bg-[#e8f2ff]/50 hover:text-[#0057c0]"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>الرجوع للبوابة الرئيسية</span>
        </Link>
        <p className="mt-2 px-3 text-[11px] text-on-surface-variant/70">الإصدار 2.4.0</p>
      </div>

      {/* User chip */}
      <div className="border-t border-outline-variant/70 p-3">
        <div className="flex items-center gap-3 rounded-lg border border-outline-variant/50 bg-surface px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-xs font-bold text-[#0057c0]">
            {user?.name?.trim()?.charAt(0) || 'أ'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-on-surface">{user?.name}</p>
            <p className="truncate text-[11px] text-on-surface-variant">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => logoutUser()}
            title="تسجيل الخروج"
            className="cursor-pointer rounded-md p-1.5 text-on-surface-variant transition-colors duration-150 hover:bg-red-50 hover:text-error"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}