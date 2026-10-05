'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, UserPlus } from 'lucide-react';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAdminCourses } from '@/services/adminCoursesService';
import { adminEnrollStudent, adminUnenroll, getAdminEnrollments } from '@/services/adminEnrollmentsService';
import { getAdminUsers } from '@/services/adminUsersService';
import type { AdminCourse, AdminEnrollment, AdminUser } from '@/types/admin';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusStyle(status: string) {
  if (status === 'نشط') return 'bg-brand-primary/10 text-brand-primary';
  if (status === 'مكتمل') return 'bg-emerald-100 text-emerald-700';
  return 'bg-brand-chip text-brand-muted-strong';
}

export default function AdminEnrollmentsPage() {
  const [rows, setRows] = useState<AdminEnrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [isPaidFilter, setIsPaidFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [isCompletedFilter, setIsCompletedFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enroll dialog
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [enrollStudentSlug, setEnrollStudentSlug] = useState('');
  const [enrollCourseSlug, setEnrollCourseSlug] = useState('');
  const [enrollBusy, setEnrollBusy] = useState(false);

  // Unenroll confirm
  const [unenrolling, setUnenrolling] = useState<AdminEnrollment | null>(null);
  const [unenrollBusy, setUnenrollBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminEnrollments({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        isPaid: isPaidFilter === 'ALL' ? undefined : isPaidFilter === 'true',
        isCompleted: isCompletedFilter === 'ALL' ? undefined : isCompletedFilter === 'true',
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('تعذر تحميل بيانات التسجيلات.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, isPaidFilter, isCompletedFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEnrollDialog = async () => {
    setEnrollOpen(true);
    setEnrollStudentSlug('');
    setEnrollCourseSlug('');
    try {
      const [studentRes, courseRes] = await Promise.all([
        getAdminUsers({ role: 'STUDENT', limit: 100 }),
        getAdminCourses({ limit: 100 }),
      ]);
      setStudents(studentRes.data);
      setCourses(courseRes.data);
    } catch {
      toast.error('تعذر تحميل بيانات الطلاب والدورات.');
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentSlug || !enrollCourseSlug) {
      toast.error('يرجى اختيار الطالب والدورة.');
      return;
    }
    setEnrollBusy(true);
    try {
      await adminEnrollStudent(enrollStudentSlug, enrollCourseSlug);
      toast.success('تم تسجيل الطالب في الدورة بنجاح.');
      setEnrollOpen(false);
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل تسجيل الطالب.');
    } finally {
      setEnrollBusy(false);
    }
  };

  const handleUnenroll = async () => {
    if (!unenrolling) return;
    setUnenrollBusy(true);
    try {
      await adminUnenroll(unenrolling.id);
      toast.success('تم إلغاء الاشتراك بنجاح.');
      setUnenrolling(null);
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل إلغاء الاشتراك.');
    } finally {
      setUnenrollBusy(false);
    }
  };

  return (
    <>
      <PageTitle title={adminTitle('الاشتراكات والتسجيلات')} />
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-8 sm:py-8">
        {/* Header matching design */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold sm:text-xl text-brand-text">الاشتراكات والتسجيلات</h1>
            <p className="mt-1 text-sm text-brand-muted">
              {total.toLocaleString('ar-EG')} تسجيل معروض
            </p>
          </div>
          <button
            type="button"
            onClick={openEnrollDialog}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <UserPlus className="h-4 w-4" />
            + تسجيل طالب
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث باسم الطالب أو الدورة…"
            className="w-full max-w-xs rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text outline-none transition focus:border-brand-primary"
          />
          <Select
            value={isPaidFilter}
            onValueChange={(val) => {
              setIsPaidFilter(val as 'ALL' | 'true' | 'false');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32 rounded-full border-brand-border bg-brand-surface text-xs">
              <SelectValue placeholder="حالة الدفع" />
            </SelectTrigger>
            <SelectContent className="bg-brand-surface border-brand-border">
              <SelectItem value="ALL">كل الدفع</SelectItem>
              <SelectItem value="true">مدفوع</SelectItem>
              <SelectItem value="false">مجاني</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={isCompletedFilter}
            onValueChange={(val) => {
              setIsCompletedFilter(val as 'ALL' | 'true' | 'false');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32 rounded-full border-brand-border bg-brand-surface text-xs">
              <SelectValue placeholder="حالة الإكمال" />
            </SelectTrigger>
            <SelectContent className="bg-brand-surface border-brand-border">
              <SelectItem value="ALL">كل الحالات</SelectItem>
              <SelectItem value="true">مكتمل</SelectItem>
              <SelectItem value="false">قيد التقدم</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-4 text-xs font-semibold text-brand-accent">
            {error}
          </div>
        )}

        {/* Table matching design */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-brand-border bg-brand-surface shadow-sm">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-brand-border text-start text-xs text-brand-muted">
                <th className="px-4 py-3 font-medium">الطالب</th>
                <th className="px-4 py-3 font-medium">المقرر</th>
                <th className="px-4 py-3 font-medium">التقدم</th>
                <th className="px-4 py-3 font-medium">الدفع</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">تاريخ التسجيل</th>
                <th className="px-4 py-3 text-end font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-6 w-full bg-brand-chip" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-muted">
                    لا توجد تسجيلات مطابقة لبحثك.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const progressVal = r.progress ?? 0;
                  const isCompleted = r.isCompleted || progressVal === 100;
                  const statusLabel = isCompleted ? 'مكتمل' : 'نشط';

                  return (
                    <tr key={r.id} className="transition hover:bg-brand-hover">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-brand-text">
                        {r.student.name}
                      </td>
                      <td className="px-4 py-3 text-brand-muted-strong">
                        {r.course.title}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-brand-chip">
                            <div
                              className="h-full rounded-full bg-brand-primary"
                              style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                            />
                          </div>
                          <span className="text-xs text-brand-muted">{progressVal}٪</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={
                            'rounded-full px-2.5 py-1 text-xs font-bold ' +
                            (r.isPaid ? 'bg-brand-secondary/15 text-brand-secondary' : 'bg-emerald-100 text-emerald-700')
                          }
                        >
                          {r.isPaid ? 'مدفوع' : 'مجاني'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={'rounded-full px-2.5 py-1 text-xs font-bold ' + statusStyle(statusLabel)}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-brand-muted">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-end">
                        <button
                          type="button"
                          onClick={() => setUnenrolling(r)}
                          className="rounded-lg p-1 text-brand-accent hover:bg-brand-hover"
                          title="إلغاء التسجيل"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      {/* Enroll Student Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="sm:max-w-md bg-brand-surface border-brand-border">
          <DialogHeader>
            <DialogTitle className="text-brand-text font-bold">تسجيل طالب في دورة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnrollSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-brand-text">اختر الطالب *</Label>
              <Select value={enrollStudentSlug} onValueChange={setEnrollStudentSlug}>
                <SelectTrigger className="mt-1 bg-brand-bg border-brand-border">
                  <SelectValue placeholder="اختر طالباً..." />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface border-brand-border max-h-56">
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.slug}>
                      {s.name} ({s.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">اختر الدورة *</Label>
              <Select value={enrollCourseSlug} onValueChange={setEnrollCourseSlug}>
                <SelectTrigger className="mt-1 bg-brand-bg border-brand-border">
                  <SelectValue placeholder="اختر دورة..." />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface border-brand-border max-h-56">
                  {courses.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:justify-start pt-2">
              <button
                type="submit"
                disabled={enrollBusy}
                className="rounded-full bg-brand-primary px-5 py-2 text-xs font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {enrollBusy ? 'جارٍ التسجيل...' : 'تسجيل الآن'}
              </button>
              <button
                type="button"
                onClick={() => setEnrollOpen(false)}
                className="rounded-full border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted-strong hover:bg-brand-hover"
              >
                إلغاء
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unenroll Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(unenrolling)}
        title="تأكيد إلغاء التسجيل"
        description={`هل أنت متأكد من إلغاء تسجيل الطالب "${unenrolling?.student.name}" من دورة "${unenrolling?.course.title}"؟`}
        confirmLabel="إلغاء الاشتراك"
        busy={unenrollBusy}
        variant="brand"
        onConfirm={handleUnenroll}
        onOpenChange={(open) => !open && setUnenrolling(null)}
      />
    </>
  );
}