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
  const [isPaid, setIsPaid] = useState<'' | 'true' | 'false'>('');
  const [isCompleted, setIsCompleted] = useState<'' | 'true' | 'false'>('');
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
        isPaid: isPaid === '' ? undefined : isPaid === 'true',
        isCompleted: isCompleted === '' ? undefined : isCompleted === 'true',
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
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
      await adminEnrollStudent(Number(enrollStudentId), Number(enrollCourseId));
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
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.student.name || row.original.student.email}</span>,
      },
      {
        accessorKey: 'course',
        header: 'المقرر',
        cell: ({ row }) => (
          <span className="text-slate-300">
            {row.original.course.title}
            <span className="mr-2 text-[11px] text-slate-500">#{row.original.course.id}</span>
          </span>
        ),
      },
      {
        accessorKey: 'progress',
        header: 'التقدم',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700/60">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.round(row.original.progress * 100))}%` }} />
            </div>
            <span className="text-xs text-slate-400">{Math.round(row.original.progress * 100)}%</span>
          </div>
        ),
      },
      {
        accessorKey: 'isPaid',
        header: 'الدفع',
        cell: ({ row }) => (
          <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', row.original.isPaid ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300')}>
            {row.original.isPaid ? 'مدفوع' : 'غير مدفوع'}
          </span>
        ),
      },
      {
        accessorKey: 'isCompleted',
        header: 'الحالة',
        cell: ({ row }) => (
          <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', row.original.isCompleted ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-600 bg-slate-700/40 text-slate-300')}>
            {row.original.isCompleted ? 'مكتمل' : 'قيد الدراسة'}
          </span>
        ),
      },
      {
        accessorKey: 'startedAt',
        header: 'تاريخ التسجيل',
        cell: ({ row }) => <span className="text-slate-400">{formatDate(row.original.startedAt)}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button type="button" title="إلغاء التسجيل" onClick={() => setUnenrolling(row.original)} className="rounded-lg border border-red-500/40 p-2 text-red-300 transition-colors duration-150 hover:border-red-400 hover:text-red-200">
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

  const applySearch = () => setSearch(searchInput.trim());

  const rangeLabel = total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">التسجيلات</h1>
          <p className="mt-1 text-sm text-slate-400">تسجيل الطلاب في المقررات وإدارتها — {total} تسجيل.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => void load()}>
            <RefreshCw className="mr-0 h-4 w-4" />
            تحديث
          </Button>
          <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={() => void openEnrollDialog()}>
            <Plus className="mr-0 h-4 w-4" />
            تسجيل طالب
          </Button>
        </div>
      </div>

      <Card className="border-slate-700/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-200">بحث وعوامل تصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                dir="rtl"
                placeholder="ابحث باسم الطالب أو المقرر..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                className="border-slate-700 bg-slate-900/50 pr-9 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
            <Select value={isPaid} onValueChange={(v) => { setIsPaid(v as '' | 'true' | 'false'); setPage(1); }}>
              <SelectTrigger className="w-36 border-slate-700 bg-slate-900/50 text-slate-100">
                <SelectValue placeholder="الدفع" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-card text-slate-100">
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="true">مدفوع</SelectItem>
                <SelectItem value="false">غير مدفوع</SelectItem>
              </SelectContent>
            </Select>
            <Select value={isCompleted} onValueChange={(v) => { setIsCompleted(v as '' | 'true' | 'false'); setPage(1); }}>
              <SelectTrigger className="w-36 border-slate-700 bg-slate-900/50 text-slate-100">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-card text-slate-100">
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="true">مكتمل</SelectItem>
                <SelectItem value="false">قيد الدراسة</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={applySearch}>
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{error}</p>}

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا توجد تسجيلات مطابقة." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          عرض {rangeLabel} من {total}
        </p>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-28 border-slate-700 bg-slate-900/50 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-card text-slate-100">
              {[10, 15, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n} / صفحة</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            السابق
          </Button>
          <span className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-sm text-slate-300">
            صفحة {page} / {Math.max(1, totalPages)}
          </span>
          <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </div>
      </div>

      {/* enroll dialog */}
      <Dialog open={enrollOpen} onOpenChange={(open) => { if (!open && !enrollBusy) setEnrollOpen(false); }}>
        <DialogContent className="border-slate-700/60 bg-card text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">تسجيل طالب في مقرر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-200">الطالب *</Label>
              <Select value={enrollStudentId} onValueChange={setEnrollStudentId}>
                <SelectTrigger className="border-slate-700 bg-slate-900/50 text-slate-100">
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent className="max-h-72 border-slate-700 bg-card text-slate-100">
                  {students.map((student) => <SelectItem key={student.id} value={String(student.id)}>{student.name || student.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-200">المقرر *</Label>
              <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
                <SelectTrigger className="border-slate-700 bg-slate-900/50 text-slate-100">
                  <SelectValue placeholder="اختر المقرر" />
                </SelectTrigger>
                <SelectContent className="max-h-72 border-slate-700 bg-card text-slate-100">
                  {courses.map((course) => <SelectItem key={course.id} value={String(course.id)}>{course.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => setEnrollOpen(false)} disabled={enrollBusy}>إلغاء</Button>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={() => void doEnroll()} disabled={enrollBusy || !enrollStudentId || !enrollCourseId}>
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
      />

      <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-card p-3 text-sm text-slate-400">
        <GraduationCap className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>ملاحظة: التسجيل من لوحة التحكم يكون مدفوعًا تلقائيًا لأن الدفع معطّل، ويُمنع تكرار تسجيل نفس الطالب في نفس المقرر.</span>
      </div>
    </div>
  );
}