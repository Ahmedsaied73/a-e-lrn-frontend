'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  BookOpen,
  GraduationCap,
  ListChecks,
  Film,
  ClipboardCheck,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  PenLine,
  KeyRound,
  Rocket,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminDashboard } from '@/services/adminDashboardService';
import type { AdminDashboardData } from '@/types/admin';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-5 py-4">
        <Icon className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
        <CardTitle className="text-sm font-semibold text-on-surface">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

function SkeletonStat() {
  return (
    <div className="rounded-xl border border-outline-variant/70 bg-card p-4">
      <Skeleton className="h-4 w-24 bg-muted" />
      <Skeleton className="mt-2 h-8 w-16 bg-muted" />
    </div>
  );
}

const QUICK_ACTIONS: {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { href: '/admin/students', label: 'إضافة طالب', desc: 'إنشاء حساب طالب جديد', icon: UserPlus },
  { href: '/admin/courses', label: 'إنشاء دورة', desc: 'إضافة دورة ووحداتها', icon: BookOpen },
  { href: '/admin/courses', label: 'رفع فيديو', desc: 'رفع محتوى إلى Bunny', icon: Upload },
  { href: '/admin/quizzes', label: 'إنشاء اختبار', desc: 'ربط اختبار بفيديو', icon: PenLine },
  { href: '/admin/grading', label: 'تصحيح المقالي', desc: 'مراجعة المحاولات المعلقة', icon: FileCheck2 },
  { href: '/admin/quizzes', label: 'إدارة الاستثناءات', desc: 'فتح وصول لمحتوى التقييمات', icon: KeyRound },
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await getAdminDashboard());
    } catch (err) {
      console.error('[AdminOverview] dashboard fetch failed:', err);
      setError(true);
      toast.error('تعذر تحميل لوحة التحكم. تأكد من تشغيل الخادم.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const attemptCount = data
    ? Object.values(data.counts.attempts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      <div className="hidden p-6 lg:block lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface">نظرة عامة</h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">ملخص لحالة المنصة الآن</p>
        </div>
        {!loading && !error && (
          <div className="flex items-center gap-2 rounded-full border border-outline-variant/70 bg-white px-3 py-1.5 text-xs font-medium text-on-surface-variant">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            بيانات مباشرة
          </div>
        )}
      </div>

      {error ? (
        <Card className="mx-auto mt-10 max-w-md border-red-200">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-error" aria-hidden="true" />
            <p className="text-sm font-medium text-on-surface-variant">تعذر تحميل بيانات لوحة التحكم.</p>
            <Button variant="outline" onClick={load}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {loading ? (
              <>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonStat key={i} />
                ))}
              </>
            ) : (
              <>
                <StatCard label="الطلاب" value={data!.counts.students} icon={Users} />
                <StatCard
                  label="طلاب جدد (7 أيام)"
                  value={data!.counts.newStudentsLast7d}
                  icon={UserPlus}
                  tone="success"
                />
                <StatCard label="الدورات" value={data!.counts.courses} icon={BookOpen} />
                <StatCard label="الاشتراكات" value={data!.counts.enrollments} icon={GraduationCap} />
                <StatCard label="الاختبارات" value={data!.counts.quizzes} icon={ListChecks} />
                <StatCard
                  label="الفيديوهات الجاهزة"
                  value={`${data!.counts.videos.READY ?? 0}/${data!.counts.videos.total}`}
                  icon={Film}
                  hint={data!.counts.videos.FAILED ? `${data!.counts.videos.FAILED} فشل` : undefined}
                  tone={data!.counts.videos.FAILED ? 'danger' : 'default'}
                />
                <StatCard label="محاولات الاختبار" value={attemptCount} icon={ClipboardCheck} />
                <StatCard
                  label="بانتظار التصحيح"
                  value={data!.counts.attempts.GRADING}
                  icon={FileCheck2}
                  tone="warning"
                />
                <StatCard
                  label="واجبات بانتظار المراجعة"
                  value={data!.counts.submissionsPending}
                  icon={Clock}
                  tone="warning"
                />
              </>
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl border border-outline-variant/70 bg-white p-4 transition-shadow duration-200 hover:border-[#4ea5ff] hover:shadow-level-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#207bff] transition-colors duration-200 group-hover:bg-[#207bff] group-hover:text-white">
                  <action.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-on-surface">{action.label}</p>
                  <p className="truncate text-[11px] text-on-surface-variant">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Alerts */}
          <SectionCard
            title="تنبيهات التشغيل"
            icon={AlertTriangle}
            className="mt-6 border-outline-variant/70 bg-white"
          >
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full bg-muted" />
                <Skeleton className="h-12 w-full bg-muted" />
              </div>
            ) : !data!.alerts.hasIssues && data!.alerts.essaysPendingGrading.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                لا توجد مشاكل حالياً — كل شيء يعمل.
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/50">
                {data!.alerts.failedVideos.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
                    <div className="flex min-w-0 items-center gap-2 font-medium text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">فيديو فشل معالجته: {v.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-on-surface-variant/70">{v.failureReason || 'بدون سبب'}</span>
                  </li>
                ))}
                {data!.alerts.stuckProcessingVideos.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
                    <div className="flex min-w-0 items-center gap-2 font-medium text-amber-700">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">عالق في المعالجة: {v.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-on-surface-variant/70">منذ {v.stuckMinutes} دقيقة</span>
                  </li>
                ))}
                {data!.alerts.essaysPendingGrading.length > 0 && (
                  <li className="flex items-center justify-between gap-3 py-2.5 text-[13px] text-on-surface-variant">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                      <span className="truncate">مقالي بانتظار التصحيح</span>
                    </div>
                    <span className="shrink-0 text-xs text-on-surface-variant/70">{data!.alerts.essaysPendingGrading.length} محاولة</span>
                  </li>
                )}
              </ul>
            )}
          </SectionCard>

          {/* Revision queue teaser */}
          {!loading && data!.alerts.essaysPendingGrading.length > 0 && (
            <SectionCard
              title="أحدث محاولات المقالي بانتظار التصحيح"
              icon={FileCheck2}
              className="mt-6 border-outline-variant/70 bg-white"
            >
              <ul className="divide-y divide-outline-variant/50">
                {data!.alerts.essaysPendingGrading.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                    <span className="truncate font-medium text-on-surface">
                      {a.user.name}
                      <span className="font-normal text-on-surface-variant"> — {a.quiz?.bunnyVideo?.title || a.quiz?.title || 'اختبار'}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-on-surface-variant/70">
                        {a.submittedAt ? formatDate(a.submittedAt) : formatDate(a.startedAt)}
                      </span>
                      <StatusBadge status={a.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Recent activity */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <SectionCard title="أحدث المستخدمين" icon={Users} className="border-outline-variant/70 bg-white">
              {loading ? (
                <Skeleton className="h-24 w-full bg-muted" />
              ) : (
                <ul className="divide-y divide-outline-variant/50">
                  {data!.recent.users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate font-medium text-on-surface">{u.name}</span>
                      <span className="shrink-0 text-xs text-on-surface-variant/70">{formatDate(u.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="أحدث الاشتراكات" icon={GraduationCap} className="border-outline-variant/70 bg-white">
              {loading ? (
                <Skeleton className="h-24 w-full bg-muted" />
              ) : (
                <ul className="divide-y divide-outline-variant/50">
                  {data!.recent.enrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate font-medium text-on-surface">
                        {e.user.name}
                        <span className="font-normal text-on-surface-variant"> — {e.course.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-on-surface-variant/70">{formatDate(e.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="آخر المحاولات" icon={ClipboardCheck} className="border-outline-variant/70 bg-white">
              {loading ? (
                <Skeleton className="h-24 w-full bg-muted" />
              ) : (
                <ul className="divide-y divide-outline-variant/50">
                  {data!.recent.attempts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate font-medium text-on-surface">
                        {a.user.name}
                        <span className="font-normal text-on-surface-variant"> — {a.quiz?.bunnyVideo?.title || a.quiz?.title || 'اختبار'}</span>
                      </span>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      )}
      </div>

      {/* ── Mobile (lg:hidden) — matches the Academic Precision mobile frame ── */}
      <div className="lg:hidden">
        <div className="space-y-4 px-4 pb-8 pt-3">
          {/* Greeting + live pulse */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-on-surface">مرحباً بك</h1>
              <p className="mt-0.5 text-xs text-on-surface-variant">إليك ملخص المنصة الآن</p>
            </div>
            {!loading && !error && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary-fixed px-2.5 py-1 text-[10px] font-semibold text-[#00487f]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                بيانات مباشرة
              </span>
            )}
          </div>

          {/* Health banner */}
          {!error &&
            (loading ? (
              <Skeleton className="h-12 w-full rounded-2xl bg-muted" />
            ) : data!.alerts.hasIssues || data!.alerts.essaysPendingGrading.length > 0 ? (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {data!.alerts.failedVideos.length + data!.alerts.stuckProcessingVideos.length} فيديو بحاجة إلى انتباه
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                كل شيء يعمل — لا توجد مشاكل حالياً
              </div>
            ))}

          {/* Hero stat */}
          {loading ? (
            <Skeleton className="h-36 w-full rounded-2xl bg-muted" />
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-[#207bff] p-5 text-on-primary">
              <div className="absolute -left-6 -top-8 h-28 w-28 rounded-full bg-white/10" aria-hidden="true" />
              <div className="absolute -bottom-10 -right-4 h-24 w-24 rounded-full bg-white/5" aria-hidden="true" />
              <div className="relative">
                <p className="text-xs font-medium text-on-primary/80">المحتوى الجاهز للمشاهدة</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-[44px] font-extrabold leading-none tracking-tight">
                    {data!.counts.videos.READY ?? 0}
                  </span>
                  <span className="mb-1 text-base font-semibold text-on-primary/80">
                    / {data!.counts.videos.total}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-on-primary"
                    style={{
                      width: `${
                        data!.counts.videos.total
                          ? Math.round(((data!.counts.videos.READY ?? 0) / data!.counts.videos.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-on-primary/80">
                  {data!.counts.videos.FAILED
                    ? `فشل معالجة ${data!.counts.videos.FAILED} — أعد الرفع`
                    : 'جميع المحاضرات جاهزة للمشاهدة'}
                </p>
              </div>
            </div>
          )}

          {/* KPI 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { label: 'الطلاب', value: data?.counts.students, icon: Users, chip: 'bg-primary-fixed text-[#004397]' },
                { label: 'الدورات', value: data?.counts.courses, icon: BookOpen, chip: 'bg-secondary-fixed text-[#00487f]' },
                { label: 'الاشتراكات', value: data?.counts.enrollments, icon: GraduationCap, chip: 'bg-tertiary-fixed text-[#004395]' },
                { label: 'بانتظار التصحيح', value: data?.counts.attempts.GRADING, icon: ClipboardCheck, chip: 'bg-error-container text-[#93000a]' },
              ] as {
                label: string;
                value: number | undefined;
                icon: React.ComponentType<{ className?: string }>;
                chip: string;
              }[]
            ).map((k) => (
              <div
                key={k.label}
                className="flex items-center gap-3 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4"
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', k.chip)}>
                  <k.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-on-surface-variant">{k.label}</p>
                  <p className="text-lg font-bold leading-tight text-on-surface">{loading ? '…' : (k.value ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="mb-2 px-1 text-sm font-bold text-on-surface">إجراءات سريعة</h2>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {QUICK_ACTIONS.slice(0, 4).map((action) => (
                <Link key={action.label} href={action.href} className="snap-start">
                  <div className="flex w-[150px] flex-col items-start gap-2 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-3.5 transition-transform active:scale-[0.98]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#207bff]">
                      <action.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold text-on-surface">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent students */}
          <section className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest">
            <header className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <Users className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                أحدث الطلاب
              </h2>
              <Link href="/admin/students" className="text-xs font-semibold text-[#0057c0]">
                عرض الكل
              </Link>
            </header>
            <ul className="divide-y divide-outline-variant/40">
              {loading ? (
                <Skeleton className="m-4 h-14 w-[calc(100%-2rem)] bg-muted" />
              ) : (
                data!.recent.users.slice(0, 3).map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-[#004397]">
                        {u.name.trim().charAt(0)}
                      </span>
                      <span className="truncate text-xs font-semibold text-on-surface">{u.name}</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-on-surface-variant/70">{formatDate(u.createdAt)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Recent subscriptions */}
          <section className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest">
            <header className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <GraduationCap className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                أحدث الاشتراكات
              </h2>
              <Link href="/admin/students" className="text-xs font-semibold text-[#0057c0]">
                عرض الكل
              </Link>
            </header>
            <ul className="divide-y divide-outline-variant/40">
              {loading ? (
                <Skeleton className="m-4 h-14 w-[calc(100%-2rem)] bg-muted" />
              ) : (
                data!.recent.enrollments.slice(0, 3).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-xs font-bold text-[#00487f]">
                        {e.user.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-on-surface">{e.user.name}</p>
                        <p className="truncate text-[10px] text-on-surface-variant">{e.course.title}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-on-surface-variant/70">{formatDate(e.createdAt)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Recent attempts */}
          <section className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest">
            <header className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <ClipboardCheck className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
                آخر المحاولات
              </h2>
              <Link href="/admin/grading" className="text-xs font-semibold text-[#0057c0]">
                عرض الكل
              </Link>
            </header>
            <ul className="divide-y divide-outline-variant/40">
              {loading ? (
                <Skeleton className="m-4 h-14 w-[calc(100%-2rem)] bg-muted" />
              ) : (
                data!.recent.attempts.slice(0, 3).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error-container text-xs font-bold text-[#93000a]">
                        {a.user.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-on-surface">{a.user.name}</p>
                        <p className="truncate text-[10px] text-on-surface-variant">
                          {a.quiz?.bunnyVideo?.title || a.quiz?.title || 'اختبار'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Motivation micro-card */}
          <div className="flex items-center gap-3 rounded-2xl bg-primary-fixed/70 px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#207bff] text-on-primary">
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-xs font-semibold leading-relaxed text-[#001a43]">
              واصل التقدم — أنت تبني مستقبل طلابك خطوة بخطوة
            </p>
          </div>
        </div>
      </div>
    </>
  );
}