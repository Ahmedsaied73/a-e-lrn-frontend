'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteQuiz, grantQuizExemption, listAllAdminQuizzes } from '@/services/adminQuizService';
import type { AdminQuiz } from '@/types/admin';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exception modal state
  const [exceptionFor, setExceptionFor] = useState<AdminQuiz | null>(null);
  const [studentSlug, setStudentSlug] = useState('');
  const [reason, setReason] = useState('');
  const [grantedCount, setGrantedCount] = useState(0);
  const [exceptionBusy, setExceptionBusy] = useState(false);

  // Delete quiz modal state
  const [deletingQuiz, setDeletingQuiz] = useState<AdminQuiz | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAllAdminQuizzes({ page, limit: pageSize, search: search.trim() || undefined });
      setQuizzes(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('تعذر تحميل بيانات الاختبارات.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGrantException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionFor) return;
    if (!studentSlug.trim()) {
      toast.error('يرجى إدخال معرّف أو بريد الطالب.');
      return;
    }

    const videoSlug = exceptionFor.videoSlug;
    if (!videoSlug) {
      toast.error('هذا الاختبار غير مرتبط بفيديو محدد لمنح استثناء له.');
      return;
    }

    setExceptionBusy(true);
    try {
      await grantQuizExemption(videoSlug, studentSlug.trim(), reason.trim() || undefined);
      toast.success('تم منح الاستثناء للطالب بنجاح.');
      setGrantedCount((c) => c + 1);
      setExceptionFor(null);
      setStudentSlug('');
      setReason('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل منح الاستثناء.');
    } finally {
      setExceptionBusy(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deletingQuiz) return;
    setDeleteBusy(true);
    try {
      await deleteQuiz(deletingQuiz.slug);
      toast.success('تم حذف الاختبار بنجاح.');
      setDeletingQuiz(null);
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل حذف الاختبار.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <PageTitle title={adminTitle('الاختبارات')} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Header matching design */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-brand-text">الاختبارات</h1>
            <p className="mt-1 text-sm text-brand-muted">
              {total.toLocaleString('ar-EG')} اختبار مرتبط بفيديوهات المنصة
            </p>
          </div>
          <Link
            href="/admin/courses"
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            + اختبار جديد (من الدورات)
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث باسم الاختبار أو الدورة…"
            className="w-full max-w-xs rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text outline-none transition focus:border-brand-primary"
          />
        </div>

        {/* Error alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-4 text-xs font-semibold text-brand-accent">
            {error}
          </div>
        )}

        {/* Granted notification banner */}
        {grantedCount > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            تم منح {grantedCount.toLocaleString('ar-EG')} استثناء بنجاح في هذه الجلسة.
          </div>
        )}

        {/* Table matching design */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-brand-border bg-brand-surface shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-brand-border text-start text-xs text-brand-muted">
                <th className="px-4 py-3 font-medium">الاختبار</th>
                <th className="px-4 py-3 font-medium">المقرر</th>
                <th className="px-4 py-3 font-medium">الفيديو</th>
                <th className="px-4 py-3 font-medium">المدة</th>
                <th className="px-4 py-3 font-medium">نسبة النجاح</th>
                <th className="px-4 py-3 font-medium">المحاولات</th>
                <th className="px-4 py-3 text-end font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-6 w-full bg-brand-chip" />
                    </td>
                  </tr>
                ))
              ) : quizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-muted">
                    لا توجد اختبارات مطابقة لبحثك.
                  </td>
                </tr>
              ) : (
                quizzes.map((q) => {
                  const durationText = q.timeLimitSec ? `${Math.round(q.timeLimitSec / 60)} د` : '—';
                  const passScoreText = q.passingScore != null ? `${q.passingScore}٪` : '—';

                  return (
                    <tr key={q.slug} className="transition hover:bg-brand-hover">
                      <td className="px-4 py-3 font-semibold text-brand-text">
                        {q.title}
                      </td>
                      <td className="px-4 py-3 text-brand-muted-strong">
                        {q.courseTitle}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {q.videoTitle || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {durationText}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {passScoreText}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {q.totalAttempts}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setExceptionFor(q)}
                            className="text-xs font-bold text-brand-primary hover:underline"
                          >
                            منح استثناء
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingQuiz(q)}
                            className="p-1 text-brand-accent hover:opacity-80"
                            title="حذف الاختبار"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-text disabled:opacity-40"
            >
              السابق
            </button>
            <span className="text-xs text-brand-muted">
              صفحة {page} من {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-text disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        )}
      </main>

      {/* Exception Access Modal matching design */}
      {exceptionFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl">
            <p className="text-base font-bold text-brand-text">منح استثناء لبوابة الاختبار</p>
            <p className="mt-1 text-xs text-brand-muted">{exceptionFor.title}</p>

            <form onSubmit={handleGrantException} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-text">معرّف أو بريد الطالب *</label>
                <input
                  value={studentSlug}
                  onChange={(e) => setStudentSlug(e.target.value)}
                  placeholder="student@example.com أو معرّف الطالب"
                  required
                  className="mt-1 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text">سبب الاستثناء (اختياري)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مشكلة تقنية أثناء المحاولة السابقة"
                  className="mt-1 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary"
                />
              </div>

              <div className="mt-5 flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setExceptionFor(null)}
                  disabled={exceptionBusy}
                  className="flex-1 rounded-full border border-brand-border py-2.5 text-sm font-semibold text-brand-muted-strong hover:bg-brand-hover"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={exceptionBusy || !studentSlug.trim()}
                  className="flex-1 rounded-full bg-brand-primary py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {exceptionBusy ? 'جارٍ المنح...' : 'منح الاستثناء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Quiz Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deletingQuiz)}
        title="تأكيد حذف الاختبار"
        description={`هل أنت متأكد من حذف اختبار "${deletingQuiz?.title}"؟ سيتم حذف جميع المحاولات والنتائج المسجلة له.`}
        confirmLabel="حذف الاختبار"
        busy={deleteBusy}
        variant="brand"
        onConfirm={handleDeleteQuiz}
        onOpenChange={(open) => !open && setDeletingQuiz(null)}
      />
    </>
  );
}