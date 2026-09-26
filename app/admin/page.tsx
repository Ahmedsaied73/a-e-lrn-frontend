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
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminDashboard } from '@/services/adminDashboardService';
import type { AdminDashboardData } from '@/types/admin';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

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
    <Card className={cn('rounded-2xl border-brand-border bg-brand-surface shadow-none', className)}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-brand-border px-5 py-4">
        <Icon className="h-4 w-4 text-brand-primary" aria-hidden="true" />
        <CardTitle className="text-sm font-bold text-brand-text">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">{children}</CardContent>
    </Card>
  );
}

function SkeletonStat() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
      <div className="h-1 w-full bg-brand-chip" aria-hidden="true" />
      <div className="p-5">
        <Skeleton className="h-3 w-24 bg-brand-chip" />
        <Skeleton className="mt-2.5 h-8 w-16 bg-brand-chip" />
      </div>
    </div>
  );
}

/** The design's highlight card: accent bar on top, label / big value / trend line. */
function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition-colors duration-200 hover:border-brand-border-strong">
      <div
        className={cn(
          'h-1 w-full',
          tone === 'success' && 'bg-emerald-500',
          tone === 'warning' && 'bg-brand-accent',
          tone === 'danger' && 'bg-brand-accent',
          tone === 'default' && 'bg-brand-primary',
        )}
        aria-hidden="true"
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold text-brand-muted">{label}</p>
          <span className="shrink-0 rounded-lg bg-brand-primary/10 p-1.5 text-brand-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
        <p
          className={cn(
            'mt-1.5 text-3xl font-extrabold tabular-nums text-brand-text',
            tone === 'success' && 'text-emerald-600',
            tone === 'warning' && 'text-brand-accent',
            tone === 'danger' && 'text-brand-accent',
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-2 truncate text-xs leading-relaxed text-brand-muted-strong">{hint}</p>}
      </div>
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور';

  return (
    <>
      <PageTitle title={adminTitle('نظرة عامة')} />
      <div className="mx-auto hidden max-w-6xl px-4 py-6 sm:px-8 sm:py-8 lg:block">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text">{greeting}</h1>
          <p className="mt-1.5 text-sm text-brand-muted">ملخص لحالة المنصة الآن — {data?.counts.students ?? 0} طالب مسجّل.</p>
        </div>
        {!loading && !error && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            بيانات مباشرة
          </span>
        )}
      </div>

      {error ? (
        <Card className="mx-auto mt-10 max-w-md rounded-2xl border border-brand-accent/30 bg-brand-surface shadow-none">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-brand-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-brand-muted-strong">تعذر تحميل بيانات لوحة التحكم.</p>
            <Button
              variant="outline"
              className="rounded-full border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
              onClick={load}
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Grid — the design's highlight cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <>
                {Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonStat key={i} />
                ))}
              </>
            ) : (
              <>
                <MetricCard label="الطلاب" value={data!.counts.students} icon={Users} hint={`${data!.counts.newStudentsLast7d} طالب جديد خلال 7 أيام`} />
                <MetricCard label="الدورات" value={data!.counts.courses} icon={BookOpen} />
                <MetricCard label="الاشتراكات" value={data!.counts.enrollments} icon={GraduationCap} />
                <MetricCard
                  label="الفيديوهات الجاهزة"
                  value={`${data!.counts.videos.READY ?? 0}/${data!.counts.videos.total}`}
                  icon={Film}
                  hint={data!.counts.videos.FAILED ? `${data!.counts.videos.FAILED} فشل` : 'كل الفيديوهات جاهزة'}
                  tone={data!.counts.videos.FAILED ? 'danger' : 'default'}
                />
                <MetricCard label="الاختبارات" value={data!.counts.quizzes} icon={ListChecks} />
                <MetricCard label="محاولات الاختبار" value={attemptCount} icon={ClipboardCheck} />
                <MetricCard
                  label="بانتظار التصحيح"
                  value={data!.counts.attempts.GRADING}
                  icon={FileCheck2}
                  tone="warning"
                />
                <MetricCard
                  label="واجبات بانتظار المراجعة"
                  value={data!.counts.submissionsPending}
                  icon={Clock}
                  tone="warning"
                />
                <MetricCard label="طلاب جدد (7 أيام)" value={data!.counts.newStudentsLast7d} icon={UserPlus} tone="success" />
              </>
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-8">
            <p className="mb-3 text-base font-bold text-brand-text">إجراءات سريعة</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-surface px-5 py-4 transition-colors duration-200 hover:border-brand-border-strong hover:bg-brand-hover"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-colors duration-200 group-hover:bg-brand-primary group-hover:text-white">
                    <action.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-brand-text">{action.label}</p>
                    <p className="truncate text-xs text-brand-muted">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <SectionCard
            title="تنبيهات التشغيل"
            icon={AlertTriangle}
            className="mt-6"
          >
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full bg-brand-chip" />
                <Skeleton className="h-12 w-full bg-brand-chip" />
              </div>
            ) : !data!.alerts.hasIssues && data!.alerts.essaysPendingGrading.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                لا توجد مشاكل حالياً — كل شيء يعمل.
              </div>
            ) : (
              <ul className="divide-y divide-brand-border">
                {data!.alerts.failedVideos.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
                    <div className="flex min-w-0 items-center gap-2 font-semibold text-brand-accent">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">فيديو فشل معالجته: {v.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-brand-muted">{v.failureReason || 'بدون سبب'}</span>
                  </li>
                ))}
                {data!.alerts.stuckProcessingVideos.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
                    <div className="flex min-w-0 items-center gap-2 font-semibold text-brand-muted-strong">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">عالق في المعالجة: {v.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-brand-muted">منذ {v.stuckMinutes} دقيقة</span>
                  </li>
                ))}
                {data!.alerts.essaysPendingGrading.length > 0 && (
                  <li className="flex items-center justify-between gap-3 py-2.5 text-[13px] text-brand-muted-strong">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-brand-accent" aria-hidden="true" />
                      <span className="truncate">مقالي بانتظار التصحيح</span>
                    </div>
                    <span className="shrink-0 text-xs text-brand-muted">{data!.alerts.essaysPendingGrading.length} محاولة</span>
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
              className="mt-6"
            >
              <ul className="divide-y divide-brand-border">
                {data!.alerts.essaysPendingGrading.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                    <span className="truncate font-semibold text-brand-text">
                      {a.user.name}
                      <span className="font-normal text-brand-muted"> — {a.quiz?.bunnyVideo?.title || a.quiz?.title || 'اختبار'}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-brand-muted">
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
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <SectionCard title="أحدث المستخدمين" icon={Users}>
              {loading ? (
                <Skeleton className="h-24 w-full bg-brand-chip" />
              ) : (
                <ul className="divide-y divide-brand-border">
                  {data!.recent.users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate font-semibold text-brand-text">{u.name}</span>
                      <span className="shrink-0 text-xs text-brand-muted">{formatDate(u.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="أحدث الاشتراكات" icon={GraduationCap}>
              {loading ? (
                <Skeleton className="h-24 w-full bg-brand-chip" />
              ) : (
                <ul className="divide-y divide-brand-border">
                  {data!.recent.enrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate font-semibold text-brand-text">
                        {e.user.name}
                        <span className="font-normal text-brand-muted"> — {e.course.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-brand-muted">{formatDate(e.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="آخر المحاولات" icon={ClipboardCheck}>
              {loading ? (
                <Skeleton className="h-24 w-full bg-brand-chip" />
              ) : (
                <ul className="divide-y divide-brand-border">
                  {data!.recent.attempts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate font-semibold text-brand-text">
                        {a.user.name}
                        <span className="font-normal text-brand-muted"> — {a.quiz?.bunnyVideo?.title || a.quiz?.title || 'اختبار'}</span>
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
        <div className="mx-auto max-w-6xl space-y-4 px-4 pb-8 pt-5">
          {/* Greeting + live pulse */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-brand-text">{greeting}</h1>
              <p className="mt-0.5 text-xs text-brand-muted">إليك ملخص المنصة الآن</p>
            </div>
            {!loading && !error && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                بيانات مباشرة
              </span>
            )}
          </div>

          {/* Health banner */}
          {!error &&
            (loading ? (
              <Skeleton className="h-12 w-full rounded-2xl bg-brand-chip" />
            ) : data!.alerts.hasIssues || data!.alerts.essaysPendingGrading.length > 0 ? (
              <div className="flex items-center gap-2 rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-xs font-semibold text-brand-accent">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {data!.alerts.failedVideos.length + data!.alerts.stuckProcessingVideos.length} فيديو بحاجة إلى انتباه
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                كل شيء يعمل — لا توجد مشاكل حالياً
              </div>
            ))}

          {/* Hero stat */}
          {loading ? (
            <Skeleton className="h-36 w-full rounded-2xl bg-brand-chip" />
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-brand-primary p-5 text-white">
              <div className="absolute -start-6 -top-8 h-28 w-28 rounded-full bg-white/10" aria-hidden="true" />
              <div className="absolute -bottom-10 -end-4 h-24 w-24 rounded-full bg-white/5" aria-hidden="true" />
              <div className="relative">
                <p className="text-xs font-semibold text-white/80">المحتوى الجاهز للمشاهدة</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-[44px] font-extrabold leading-none tracking-tight">
                    {data!.counts.videos.READY ?? 0}
                  </span>
                  <span className="mb-1 text-base font-semibold text-white/80">
                    / {data!.counts.videos.total}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${
                        data!.counts.videos.total
                          ? Math.round(((data!.counts.videos.READY ?? 0) / data!.counts.videos.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-white/80">
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
                { label: 'الطلاب', value: data?.counts.students, icon: Users, chip: 'bg-brand-primary/10 text-brand-primary' },
                { label: 'الدورات', value: data?.counts.courses, icon: BookOpen, chip: 'bg-brand-secondary/15 text-brand-muted-strong' },
                { label: 'الاشتراكات', value: data?.counts.enrollments, icon: GraduationCap, chip: 'bg-brand-primary/10 text-brand-primary' },
                { label: 'بانتظار التصحيح', value: data?.counts.attempts.GRADING, icon: ClipboardCheck, chip: 'bg-brand-accent/10 text-brand-accent' },
              ] as {
                label: string;
                value: number | undefined;
                icon: React.ComponentType<{ className?: string }>;
                chip: string;
              }[]
            ).map((k) => (
              <div
                key={k.label}
                className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4"
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', k.chip)}>
                  <k.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-brand-muted">{k.label}</p>
                  <p className="text-lg font-bold leading-tight text-brand-text">{loading ? '…' : (k.value ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="mb-2 px-1 text-sm font-bold text-brand-text">إجراءات سريعة</h2>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {QUICK_ACTIONS.slice(0, 4).map((action) => (
                <Link key={action.label} href={action.href} className="snap-start">
                  <div className="flex w-[150px] flex-col items-start gap-2 rounded-2xl border border-brand-border bg-brand-surface p-3.5 transition-transform active:scale-[0.98]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                      <action.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold text-brand-text">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent students */}
          <section className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
            <header className="flex items-center justify-between border-b border-brand-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-brand-text">
                <Users className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                أحدث الطلاب
              </h2>
              <Link href="/admin/students" className="text-xs font-bold text-brand-primary hover:underline">
                عرض الكل
              </Link>
            </header>
            <ul className="divide-y divide-brand-border">
              {loading ? (
                <Skeleton className="m-4 h-14 w-[calc(100%-2rem)] bg-brand-chip" />
              ) : (
                data!.recent.users.slice(0, 3).map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                        {u.name.trim().charAt(0)}
                      </span>
                      <span className="truncate text-xs font-semibold text-brand-text">{u.name}</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-brand-muted">{formatDate(u.createdAt)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Recent subscriptions */}
          <section className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
            <header className="flex items-center justify-between border-b border-brand-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-brand-text">
                <GraduationCap className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                أحدث الاشتراكات
              </h2>
              <Link href="/admin/students" className="text-xs font-bold text-brand-primary hover:underline">
                عرض الكل
              </Link>
            </header>
            <ul className="divide-y divide-brand-border">
              {loading ? (
                <Skeleton className="m-4 h-14 w-[calc(100%-2rem)] bg-brand-chip" />
              ) : (
                data!.recent.enrollments.slice(0, 3).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-secondary/15 text-xs font-bold text-brand-muted-strong">
                        {e.user.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-brand-text">{e.user.name}</p>
                        <p className="truncate text-[10px] text-brand-muted">{e.course.title}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-brand-muted">{formatDate(e.createdAt)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Recent attempts */}
          <section className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
            <header className="flex items-center justify-between border-b border-brand-border px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-brand-text">
                <ClipboardCheck className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                آخر المحاولات
              </h2>
              <Link href="/admin/grading" className="text-xs font-bold text-brand-primary hover:underline">
                عرض الكل
              </Link>
            </header>
            <ul className="divide-y divide-brand-border">
              {loading ? (
                <Skeleton className="m-4 h-14 w-[calc(100%-2rem)] bg-brand-chip" />
              ) : (
                data!.recent.attempts.slice(0, 3).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-xs font-bold text-brand-accent">
                        {a.user.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-brand-text">{a.user.name}</p>
                        <p className="truncate text-[10px] text-brand-muted">
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
          <div className="flex items-center gap-3 rounded-2xl bg-brand-primary/10 px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-xs font-semibold leading-relaxed text-brand-muted-strong">
              واصل التقدم — أنت تبني مستقبل طلابك خطوة بخطوة
            </p>
          </div>
        </div>
      </div>
    </>
  );
}