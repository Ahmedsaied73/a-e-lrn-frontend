'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

function formatCount(value: number): string {
  return value.toLocaleString('ar-EG');
}

function HighlightSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
      <div className="h-1 w-full bg-brand-chip" aria-hidden="true" />
      <div className="p-5">
        <Skeleton className="h-3 w-24 bg-brand-chip" />
        <Skeleton className="mt-2.5 h-8 w-20 bg-brand-chip" />
        <Skeleton className="mt-2 h-3 w-32 bg-brand-chip" />
      </div>
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

  const gradingCount = data?.counts.attempts.GRADING ?? 0;
  const failedVideos = data?.alerts.failedVideos ?? [];
  const stuckVideos = data?.alerts.stuckProcessingVideos ?? [];
  const videoAttention = failedVideos.length + stuckVideos.length;
  const pendingEssays = data?.alerts.essaysPendingGrading ?? [];
  const submissionsPending = data?.counts.submissionsPending ?? 0;
  const readyVideos = data?.counts.videos.READY ?? 0;
  const totalVideos = data?.counts.videos.total ?? 0;
  const failedCount = data?.counts.videos.FAILED ?? 0;
  const oldestPending = pendingEssays.length > 0 ? pendingEssays[pendingEssays.length - 1] : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور';

  return (
    <>
      <PageTitle title={adminTitle('نظرة عامة')} />
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-9">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-text">
            {greeting} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-brand-muted">دي حالة منصتك النهاردة — بالبنط العريض، مفيش حاجة محتاجة قلق.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3" aria-busy={loading} aria-live="polite">
          {loading || !data ? (
            <>
              <HighlightSkeleton />
              <HighlightSkeleton />
              <HighlightSkeleton />
            </>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
                <div className="h-1 w-full bg-emerald-500" aria-hidden="true" />
                <div className="p-5">
                  <p className="text-xs font-semibold text-brand-muted">طلابك بيكبروا</p>
                  <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-brand-text">
                    {formatCount(data.counts.students)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-brand-muted-strong">
                    {data.counts.newStudentsLast7d > 0
                      ? `+${formatCount(data.counts.newStudentsLast7d)} طالب جديد الأسبوع ده`
                      : 'إجمالي الطلاب المسجلين في المنصة'}
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
                <div className="h-1 w-full bg-emerald-500" aria-hidden="true" />
                <div className="p-5">
                  <p className="text-xs font-semibold text-brand-muted">الفيديوهات الجاهزة للعرض</p>
                  <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-brand-text">
                    {formatCount(readyVideos)}/{formatCount(totalVideos)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-brand-muted-strong">
                    {failedCount > 0
                      ? `${formatCount(failedCount)} فيديو فشل — محتاج إعادة الرفع`
                      : totalVideos > 0 && readyVideos === totalVideos
                        ? 'كل الفيديوهات جاهزة للعرض'
                        : `${formatCount(readyVideos)} من ${formatCount(totalVideos)} جاهز للعرض`}
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
                <div className="h-1 w-full bg-brand-accent" aria-hidden="true" />
                <div className="p-5">
                  <p className="text-xs font-semibold text-brand-muted">بانتظار تصحيحك</p>
                  <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-brand-text">
                    {formatCount(gradingCount)} محاولات
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-brand-muted-strong">
                    {gradingCount > 0
                      ? `أقدمها ${formatDate(oldestPending?.submittedAt ?? oldestPending?.startedAt ?? null)} — محتاجة اهتمامك`
                      : 'لا توجد محاولات معلقة — كل شيء مصحح'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

      {error ? (
        <Card
          role="alert"
          aria-live="assertive"
          className="mx-auto mt-6 max-w-md rounded-2xl border border-brand-accent/30 bg-brand-surface shadow-none"
        >
          <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-brand-accent" aria-hidden="true" />
            <p className="text-sm font-medium text-brand-muted-strong">تعذر تحميل بيانات لوحة التحكم.</p>
            <Button
              variant="outline"
              onClick={load}
              className="min-h-[44px] rounded-full border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-muted-strong transition motion-reduce:transition-none hover:bg-brand-hover hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="mb-3 text-base font-bold text-brand-text">إيه اللي محتاج منك دلوقتي؟</p>
              <div className="space-y-3">
                {loading || !data ? (
                  <>
                    <Skeleton className="h-[76px] w-full rounded-2xl bg-brand-chip" />
                    <Skeleton className="h-[76px] w-full rounded-2xl bg-brand-chip" />
                    <Skeleton className="h-[76px] w-full rounded-2xl bg-brand-chip" />
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-surface px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-text">
                          {formatCount(gradingCount)} محاولات مقالية جاهزة للاعتماد
                        </p>
                        <p className="mt-0.5 truncate text-xs text-brand-muted">
                          {pendingEssays.length > 0
                            ? `أحدثها ${pendingEssays[0].user.name}`
                            : 'لا توجد محاولات معلقة الآن'}
                        </p>
                      </div>
                      <Link
                        href="/admin/grading"
                        className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-brand-primary/10 px-4 py-2 text-xs font-bold text-brand-primary transition motion-reduce:transition-none hover:bg-brand-primary hover:text-white"
                      >
                        افتح صندوق التصحيح
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-surface px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-text">
                          {formatCount(videoAttention)} فيديوهات محتاجة انتباه
                        </p>
                        <p className="mt-0.5 truncate text-xs text-brand-muted">
                          {failedCount > 0 ? 'فشل المعالجة — أعد الرفع من الدورات' : 'كل الفيديوهات جاهزة للعرض'}
                        </p>
                      </div>
                      <Link
                        href="/admin/courses"
                        className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-brand-primary/10 px-4 py-2 text-xs font-bold text-brand-primary transition motion-reduce:transition-none hover:bg-brand-primary hover:text-white"
                      >
                        عرض الدورات
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-surface px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-text">
                          {formatCount(submissionsPending)} بانتظار المراجعة
                        </p>
                        <p className="mt-0.5 truncate text-xs text-brand-muted">تسليمات بانتظار مراجعتك</p>
                      </div>
                      <Link
                        href="/admin/courses"
                        className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-brand-primary/10 px-4 py-2 text-xs font-bold text-brand-primary transition motion-reduce:transition-none hover:bg-brand-primary hover:text-white"
                      >
                        مراجعة الواجب
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-l from-brand-primary/10 via-brand-secondary/5 to-transparent px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-text">محتاج تنجز حاجة بسرعة؟</p>
                  <p className="mt-0.5 text-xs text-brand-muted">قول للمساعد الإداري اللي عايزه بالكلام العادي.</p>
                </div>
                <Link
                  href="/admin/agent"
                  className="inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white transition motion-reduce:transition-none hover:bg-brand-primary/90"
                >
                  اتكلم مع المساعد
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-3 text-base font-bold text-brand-text">آخر المقالي المنتظر</p>
              <div className="divide-y divide-brand-border rounded-2xl border border-brand-border bg-brand-surface">
                {loading || !data ? (
                  <Skeleton className="m-4 h-14 w-[calc(100%-2rem)] bg-brand-chip" />
                ) : pendingEssays.length > 0 ? (
                  pendingEssays.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-text">{a.user.name}</p>
                        <p className="truncate text-xs text-brand-muted">
                          {a.quiz?.bunnyVideo?.title || a.quiz?.title || 'اختبار'}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-brand-muted">
                        {formatDate(a.submittedAt ?? a.startedAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="px-5 py-6 text-center text-xs font-semibold text-brand-muted">
                    لا توجد محاولات معلقة — كل شيء مصحح.
                  </p>
                )}
              </div>
              <Link
                href="/admin/grading"
                className="mt-3 inline-flex min-h-[44px] items-center text-xs font-bold text-brand-primary hover:underline"
              >
                عرض الكل ←
              </Link>
            </div>
          </div>
        </>
      )}
      </div>
    </>
  );
}