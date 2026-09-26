'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { GraduationCap, Plus, RefreshCw, Search, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminEnrollmentsPage() {
  const [rows, setRows] = useState<AdminEnrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isPaid, setIsPaid] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [isCompleted, setIsCompleted] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // enroll dialog
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [enrollBusy, setEnrollBusy] = useState(false);

  // unenroll confirm
  const [unenrolling, setUnenrolling] = useState<AdminEnrollment | null>(null);
  const [unenrollBusy, setUnenrollBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminEnrollments({
        page,
        limit: pageSize,
        search: search || undefined,
        isPaid: isPaid === 'ALL' ? undefined : isPaid === 'true',
        isCompleted: isCompleted === 'ALL' ? undefined : isCompleted === 'true',
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      if (page > res.meta.totalPages) setPage(Math.max(1, res.meta.totalPages));
    } catch {
      setError('تعذر تحميل التسجيلات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, isPaid, isCompleted]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEnrollDialog = async () => {
    setEnrollOpen(true);
    setEnrollStudentId('');
    setEnrollCourseId('');
    try {
      const [studentRes, courseRes] = await Promise.all([
        getAdminUsers({ role: 'STUDENT', limit: 100 }),
        getAdminCourses({ limit: 100 }),
      ]);
      setStudents(studentRes.data);
      setCourses(courseRes.data);
    } catch {
      toast.error('تعذر تحميل قوائم الطلاب والمقررات.');
    }
  };

  const doEnroll = async () => {
    if (!enrollStudentId || !enrollCourseId) return;
    setEnrollBusy(true);
    try {
      await adminEnrollStudent(enrollStudentId, enrollCourseId);
      toast.success('تم تسجيل الطالب في المقرر.');
      setEnrollOpen(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل تسجيل الطالب.');
    } finally {
      setEnrollBusy(false);
    }
  };

  const confirmUnenroll = async () => {
    if (!unenrolling) return;
    setUnenrollBusy(true);
    try {
      await adminUnenroll(unenrolling.id);
      toast.success('تم إلغاء التسجيل.');
      setUnenrolling(null);
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل إلغاء التسجيل.');
      setUnenrolling(null);
    } finally {
      setUnenrollBusy(false);
    }
  };

  const columns = useMemo<ColumnDef<AdminEnrollment>[]>(
    () => [
      { accessorKey: 'id', header: 'الرقم', size: 70 },
      {
        accessorKey: 'student',
        header: 'الطالب',
        cell: ({ row }) => <span className="font-semibold text-brand-text">{row.original.student.name || row.original.student.email}</span>,
      },
      {
        accessorKey: 'course',
        header: 'المقرر',
        cell: ({ row }) => (
          <span className="text-brand-muted-strong">
            {row.original.course.title}
            <span className="me-2 text-[11px] text-brand-muted">#{row.original.course.slug}</span>
          </span>
        ),
      },
      {
        accessorKey: 'progress',
        header: 'التقدم',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-brand-chip">
              <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, Math.round(row.original.progress * 100))}%` }} />
            </div>
            <span className="text-xs font-semibold text-brand-muted">{Math.round(row.original.progress * 100)}%</span>
          </div>
        ),
      },
      {
        accessorKey: 'isPaid',
        header: 'الدفع',
        cell: ({ row }) => (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-bold',
              row.original.isPaid ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-chip text-brand-muted-strong',
            )}
          >
            {row.original.isPaid ? 'مدفوع' : 'غير مدفوع'}
          </span>
        ),
      },
      {
        accessorKey: 'isCompleted',
        header: 'الحالة',
        cell: ({ row }) => (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-bold',
              row.original.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-primary/10 text-brand-primary',
            )}
          >
            {row.original.isCompleted ? 'مكتمل' : 'قيد الدراسة'}
          </span>
        ),
      },
      {
        accessorKey: 'startedAt',
        header: 'تاريخ التسجيل',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{formatDate(row.original.startedAt)}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button type="button" title="إلغاء التسجيل" onClick={() => setUnenrolling(row.original)} className="rounded-full border border-brand-accent/30 p-2 text-brand-accent transition-colors duration-150 hover:bg-brand-accent hover:text-white">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1); };

  const rangeLabel = total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8 sm:py-8">
      <PageTitle title={adminTitle('التسجيلات')} />

      {/* Section header — eyebrow / heading / sub-copy, then the page actions. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">الطلاب والمقررات</p>
          <h1 className="mt-1 text-xl font-extrabold text-brand-text">التسجيلات</h1>
          <p className="mt-1 text-sm text-brand-muted">تسجيل الطلاب في المقررات وإدارتها — {total} تسجيل.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="rounded-full border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
            onClick={() => void load()}
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button
            className="rounded-full bg-brand-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
            onClick={() => void openEnrollDialog()}
          >
            <Plus className="h-4 w-4" />
            تسجيل طالب
          </Button>
        </div>
      </div>

      {/* Filter bar — the design's rounded-full fields + solid pill action. */}
      <Card className="rounded-2xl border-brand-border bg-brand-surface shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-brand-text">بحث وعوامل تصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <Input
                dir="rtl"
                placeholder="ابحث باسم الطالب أو المقرر..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                className="rounded-full border-brand-border bg-brand-surface pe-10 text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30"
              />
            </div>
            <Select value={isPaid} onValueChange={(v) => { setIsPaid(v as 'ALL' | 'true' | 'false'); setPage(1); }}>
              <SelectTrigger className="h-10 w-36 rounded-full border-brand-border bg-brand-surface text-sm font-semibold text-brand-muted-strong">
                <SelectValue placeholder="الدفع" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
                <SelectItem value="ALL" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الكل</SelectItem>
                <SelectItem value="true" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">مدفوع</SelectItem>
                <SelectItem value="false" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">غير مدفوع</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isCompleted} onValueChange={(v) => { setIsCompleted(v as 'ALL' | 'true' | 'false'); setPage(1); }}>
              <SelectTrigger className="h-10 w-36 rounded-full border-brand-border bg-brand-surface text-sm font-semibold text-brand-muted-strong">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
                <SelectItem value="ALL" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الكل</SelectItem>
                <SelectItem value="true" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">مكتمل</SelectItem>
                <SelectItem value="false" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">قيد الدراسة</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="rounded-full bg-brand-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
              onClick={applySearch}
            >
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm font-semibold text-brand-accent">
          {error}
        </p>
      )}

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا توجد تسجيلات مطابقة." variant="brand" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-brand-muted">
          عرض {rangeLabel} من {total}
        </p>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-9 w-28 rounded-full border-brand-border bg-brand-surface text-xs font-semibold text-brand-muted-strong">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
              {[10, 15, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)} className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">
                  {n} / صفحة
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-9 rounded-full border-brand-border bg-brand-surface px-3.5 text-xs font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            السابق
          </Button>
          <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-muted-strong">
            صفحة {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            className="h-9 rounded-full border-brand-border bg-brand-surface px-3.5 text-xs font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      </div>

      {/* enroll dialog */}
      <Dialog open={enrollOpen} onOpenChange={(open) => { if (!open && !enrollBusy) setEnrollOpen(false); }}>
        <DialogContent className="rounded-2xl border-brand-border bg-brand-surface text-brand-text">
          <DialogHeader>
            <DialogTitle className="text-brand-text">تسجيل طالب في مقرر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-brand-muted-strong">الطالب *</Label>
              <Select value={enrollStudentId} onValueChange={setEnrollStudentId}>
                <SelectTrigger className="rounded-full border-brand-border bg-brand-surface text-brand-text">
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl border-brand-border bg-brand-surface text-brand-text">
                  {students.map((student) => <SelectItem key={student.slug} value={student.slug} className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">{student.name || student.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-brand-muted-strong">المقرر *</Label>
              <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
                <SelectTrigger className="rounded-full border-brand-border bg-brand-surface text-brand-text">
                  <SelectValue placeholder="اختر المقرر" />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl border-brand-border bg-brand-surface text-brand-text">
                  {courses.map((course) => <SelectItem key={course.slug} value={course.slug} className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">{course.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2.5">
            <Button variant="outline" className="rounded-full border-brand-border bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text" onClick={() => setEnrollOpen(false)} disabled={enrollBusy}>إلغاء</Button>
            <Button className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90" onClick={() => void doEnroll()} disabled={enrollBusy || !enrollStudentId || !enrollCourseId}>
              {enrollBusy ? 'جارٍ التسجيل...' : 'تسجيل الآن'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={unenrolling !== null}
        title="إلغاء التسجيل"
        description={`هل أنت متأكد من إلغاء تسجيل "${unenrolling?.student.name || unenrolling?.student.email}" في "${unenrolling?.course.title}"؟ سيتم حذف التسجيل نهائيًا.`}
        confirmLabel="إلغاء التسجيل"
        busy={unenrollBusy}
        onOpenChange={(open) => { if (!open) setUnenrolling(null); }}
        onConfirm={() => void confirmUnenroll()}
        variant="brand"
      />

      <div className="flex items-center gap-2.5 rounded-2xl border border-brand-border bg-brand-chip px-4 py-3 text-sm text-brand-muted-strong">
        <GraduationCap className="h-4 w-4 shrink-0 text-brand-primary" />
        <span>ملاحظة: التسجيل من لوحة التحكم يكون مدفوعًا تلقائيًا لأن الدفع معطّل، ويُمنع تكرار تسجيل نفس الطالب في نفس المقرر.</span>
      </div>
    </div>
  );
}