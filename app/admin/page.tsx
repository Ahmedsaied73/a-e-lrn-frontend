'use client';

import { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
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
        <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <CardTitle className="text-sm font-semibold text-slate-200">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

function SkeletonStat() {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-card p-4">
      <Skeleton className="h-4 w-24 bg-muted" />
      <Skeleton className="mt-2 h-8 w-16 bg-muted" />
    </div>
  );
}

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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">نظرة عامة</h1>
          <p className="mt-1 text-[13px] text-slate-500">ملخص لحالة المنصة الآن</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-card px-3 py-1.5 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            بيانات مباشرة
          </div>
        )}
      </div>

      {error ? (
        <Card className="mx-auto mt-10 max-w-md border-red-500/40">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
            <p className="text-sm text-slate-300">تعذر تحميل بيانات لوحة التحكم.</p>
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

          {/* Alerts */}
          <SectionCard
            title="تنبيهات التشغيل"
            icon={AlertTriangle}
            className="mt-6 border-slate-700/60 bg-card"
          >
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full bg-muted" />
                <Skeleton className="h-12 w-full bg-muted" />
              </div>
            ) : !data!.alerts.hasIssues && data!.alerts.essaysPendingGrading.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                لا توجد مشاكل حالياً — كل شيء يعمل.
              </div>
            ) : (
              <ul className="divide-y divide-slate-800">
                {data!.alerts.failedVideos.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
                    <div className="flex min-w-0 items-center gap-2 text-red-300">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">فيديو فشل معالجته: {v.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{v.failureReason || 'بدون سبب'}</span>
                  </li>
                ))}
                {data!.alerts.stuckProcessingVideos.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
                    <div className="flex min-w-0 items-center gap-2 text-amber-300">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">عالق في المعالجة: {v.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">منذ {v.stuckMinutes} دقيقة</span>
                  </li>
                ))}
                {data!.alerts.essaysPendingGrading.length > 0 && (
                  <li className="flex items-center justify-between gap-3 py-2.5 text-[13px] text-slate-300">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
                      <span className="truncate">مقالي بانتظار التصحيح</span>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{data!.alerts.essaysPendingGrading.length} محاولة</span>
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
              className="mt-6 border-slate-700/60 bg-card"
            >
              <ul className="divide-y divide-slate-800">
                {data!.alerts.essaysPendingGrading.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                    <span className="truncate text-slate-200">
                      {a.user.name}
                      <span className="text-slate-500"> — {a.quiz?.bunnyVideo?.title || a.quiz?.title || 'اختبار'}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-500">
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
            <SectionCard title="أحدث المستخدمين" icon={Users} className="border-slate-700/60 bg-card">
              {loading ? (
                <Skeleton className="h-24 w-full bg-muted" />
              ) : (
                <ul className="divide-y divide-slate-800">
                  {data!.recent.users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate text-slate-200">{u.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(u.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="أحدث الاشتراكات" icon={GraduationCap} className="border-slate-700/60 bg-card">
              {loading ? (
                <Skeleton className="h-24 w-full bg-muted" />
              ) : (
                <ul className="divide-y divide-slate-800">
                  {data!.recent.enrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate text-slate-200">
                        {e.user.name}
                        <span className="text-slate-500"> — {e.course.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(e.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="آخر المحاولات" icon={ClipboardCheck} className="border-slate-700/60 bg-card">
              {loading ? (
                <Skeleton className="h-24 w-full bg-muted" />
              ) : (
                <ul className="divide-y divide-slate-800">
                  {data!.recent.attempts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-2.5 text-[13px]">
                      <span className="truncate text-slate-200">
                        {a.user.name}
                        <span className="text-slate-500"> — {a.quiz?.bunnyVideo?.title || a.quiz?.title || 'اختبار'}</span>
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
  );
}