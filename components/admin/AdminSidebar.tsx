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
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { logoutUser } from '@/services/authService';

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  {
    label: 'عام',
    items: [{ href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard }],
  },
  {
    label: 'الإدارة',
    items: [
      { href: '/admin/students', label: 'الطلاب', icon: Users },
      { href: '/admin/courses', label: 'الدورات والفيديوهات', icon: BookOpen },
      { href: '/admin/enrollments', label: 'الاشتراكات', icon: GraduationCap },
    ],
  },
  {
    label: 'التقييم',
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
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-e border-slate-800 bg-[#0b1220]">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <FlaskConical className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-100">لوحة التحكم</p>
          <p className="truncate text-[11px] text-slate-500">أكاديمية الكيمياء</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
                        active
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
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

      {/* Footer */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-100">
            {user?.name?.trim()?.charAt(0) || 'أ'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">{user?.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => logoutUser()}
            title="تسجيل الخروج"
            className="cursor-pointer rounded-md p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}