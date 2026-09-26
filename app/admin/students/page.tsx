'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { BookOpen, ChevronDown, ChevronsUpDown, ChevronUp, Pencil, Plus, RefreshCw, Search, Trash2, UserPlus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { deleteAdminUser, getAdminUsers, registerStudent, updateAdminUser } from '@/services/adminUsersService';
import type { AdminCourse, AdminEnrollment, AdminStudentInput, AdminUser } from '@/types/admin';
import type { GradeEnum } from '@/types/api';
import { cn } from '@/lib/utils';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

const GRADE_LABEL: Record<string, string> = {
  FIRST_SECONDARY: 'الأول الثانوي',
  SECOND_SECONDARY: 'الثاني الثانوي',
  THIRD_SECONDARY: 'الثالث الثانوي',
};

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'طالب',
  ADMIN: 'مشرف',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

function SortableHeader({ label, sortKey, sort, onSort }: { label: string; sortKey: string; sort: string; onSort: (key: string) => void }) {
  const active = sort.replace(/^-/, '') === sortKey;
  const dir = sort.startsWith('-') ? 'desc' : 'asc';
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-brand-muted transition-colors hover:bg-brand-chip hover:text-brand-primary"
    >
      {label}
      {active ? (dir === 'desc' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />}
    </button>
  );
}

export default function StudentsPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'ADMIN' | 'ALL'>('STUDENT');
  const [grade, setGrade] = useState<GradeEnum | ''>('');
  const [sort, setSort] = useState('-createdAt');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mobileActions, setMobileActions] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGrade, setEditGrade] = useState<GradeEnum | ''>('');
  const [editPhone, setEditPhone] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  // add-student dialog (reuses POST /auth/register — always STUDENT)
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AdminStudentInput>({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    grade: 'FIRST_SECONDARY',
  });
  const [addBusy, setAddBusy] = useState(false);

  // per-student courses dialog (enroll / unenroll)
  const [courseUser, setCourseUser] = useState<AdminUser | null>(null);
  const [courseRows, setCourseRows] = useState<AdminEnrollment[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [allCourses, setAllCourses] = useState<AdminCourse[]>([]);
  const [newCourseId, setNewCourseId] = useState('');
  const [courseBusy, setCourseBusy] = useState(false);

  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers({
        page,
        limit: pageSize,
        role: role === 'ALL' ? undefined : role,
        grade: grade || undefined,
        search: search || undefined,
        sort: sort || undefined,
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      if (page > res.meta.totalPages) setPage(Math.max(1, res.meta.totalPages));
    } catch {
      setError('تعذر تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, role, grade, search, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSortChange = (key: string) => {
    const active = sort.replace(/^-/, '') === key;
    setSort(active && sort.startsWith('-') ? key : `-${key}`);
  };

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      { accessorKey: 'slug', header: 'الرقم', size: 70 },
      {
        accessorKey: 'name',
        header: () => <SortableHeader label="الاسم" sortKey="name" sort={sort} onSort={onSortChange} />,
        cell: ({ row }) => <span className="font-bold text-brand-text">{row.original.name || '—'}</span>,
      },
      { accessorKey: 'email', header: 'البريد الإلكتروني', cell: ({ row }) => <span dir="ltr" className="text-brand-muted-strong">{row.original.email}</span> },
      {
        accessorKey: 'grade',
        header: 'الصف',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{row.original.grade ? GRADE_LABEL[row.original.grade] ?? row.original.grade : '—'}</span>,
      },
      {
        accessorKey: 'role',
        header: 'النوع',
        cell: ({ row }) => (
          <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', row.original.role === 'ADMIN' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-chip text-brand-muted-strong')}>
            {ROLE_LABEL[row.original.role] ?? row.original.role}
          </span>
        ),
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'آخر دخول',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{formatDate(row.original.lastLoginAt)}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: () => <SortableHeader label="تاريخ الإنشاء" sortKey="createdAt" sort={sort} onSort={onSortChange} />,
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{new Date(row.original.createdAt).toLocaleDateString('ar-EG')}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button type="button" title="المقررات" onClick={() => { setCourseUser(row.original); setNewCourseId(''); void loadCourseRows(row.original.slug); }} className="rounded-full border border-brand-primary/25 p-2 text-brand-primary transition-colors duration-150 hover:bg-brand-primary hover:text-white">
              <BookOpen className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="تعديل" onClick={() => { setEditing(row.original); setEditName(row.original.name || ''); setEditEmail(row.original.email); setEditGrade((row.original.grade as GradeEnum | null) ?? ''); setEditPhone(row.original.phoneNumber || ''); }} className="rounded-full border border-brand-border p-2 text-brand-muted-strong transition-colors duration-150 hover:bg-brand-hover hover:text-brand-primary">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="حذف" onClick={() => setDeleting(row.original)} className="rounded-full border border-brand-accent/30 p-2 text-brand-accent transition-colors duration-150 hover:bg-brand-accent hover:text-white">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort],
  );

  // Server owns ordering (via `sort`); tanstack only renders rows/core.
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1); };

  const saveEdit = async () => {
    if (!editing) return;
    setEditBusy(true);
    try {
      const updated = await updateAdminUser(editing.slug, {
        name: editName,
        email: editEmail,
        grade: editGrade || undefined,
        phoneNumber: editPhone,
      });
      setRows((current) => current.map((r) => (r.slug === editing.slug ? { ...r, ...updated } : r)));
      toast.success('تم تحديث بيانات الطالب.');
      setEditing(null);
    } catch {
      toast.error('فشل تحديث البيانات.');
    } finally {
      setEditBusy(false);
    }
  };

  const doAddStudent = async () => {
    setAddBusy(true);
    try {
      const added = await registerStudent(addForm);
      toast.success(`تم إنشاء حساب "${added.name || added.email}".`);
      setAddOpen(false);
      setAddForm({ name: '', email: '', password: '', phoneNumber: '', grade: 'FIRST_SECONDARY' });
      setPage(1);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل إنشاء الحساب.');
    } finally {
      setAddBusy(false);
    }
  };

  const loadCourseRows = async (userSlug: string) => {
    setCourseLoading(true);
    try {
      const [enr, courses] = await Promise.all([
        getAdminEnrollments({ userSlug, limit: 100 }),
        getAdminCourses({ limit: 100 }),
      ]);
      setCourseRows(enr.data);
      setAllCourses(courses.data);
    } catch {
      toast.error('تعذر تحميل مقررات الطالب.');
    } finally {
      setCourseLoading(false);
    }
  };

  const doEnroll = async () => {
    if (!courseUser || !newCourseId) return;
    setCourseBusy(true);
    try {
      await adminEnrollStudent(courseUser.slug, newCourseId);
      toast.success('تم تسجيل الطالب في المقرر.');
      setNewCourseId('');
      await loadCourseRows(courseUser.slug);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل تسجيل الطالب.');
    } finally {
      setCourseBusy(false);
    }
  };

  const doUnenroll = async (enrollment: AdminEnrollment) => {
    setCourseBusy(true);
    try {
      await adminUnenroll(enrollment.id);
      toast.success('تم إلغاء التسجيل.');
      if (courseUser) await loadCourseRows(courseUser.slug);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل إلغاء التسجيل.');
    } finally {
      setCourseBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteAdminUser(deleting.slug);
      toast.success('تم حذف الطالب.');
      setDeleting(null);
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر حذف الطالب.');
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const rangeLabel = total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`;

  return (
    <div className="space-y-6">
      <PageTitle title={adminTitle('الطلاب')} />
      <div className="mx-auto hidden max-w-6xl space-y-5 lg:block">
        {/* Section header — eyebrow / heading / sub-copy, then the page actions. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">الحسابات والصلاحيات</p>
            <h1 className="mt-1 text-xl font-extrabold text-brand-text">الطلاب</h1>
            <p className="mt-1 text-sm text-brand-muted">إدارة حسابات الطلاب والمشرفين — {total} مستخدم.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
              onClick={() => void load()}
            >
              <RefreshCw className="me-1.5 h-4 w-4" />
              تحديث
            </Button>
            <Button
              className="rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
              onClick={() => setAddOpen(true)}
            >
              <UserPlus className="me-1.5 h-4 w-4" />
              إضافة طالب
            </Button>
          </div>
        </div>

        {/* Filter bar — the design's rounded-full search field + solid pill action. */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <Input
              dir="rtl"
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              className="rounded-full border-brand-border bg-brand-surface pe-10 text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30"
            />
          </div>
          <Select value={role} onValueChange={(v) => { setRole(v as typeof role); setPage(1); }}>
            <SelectTrigger className="h-10 w-40 rounded-full border-brand-border bg-brand-surface text-sm font-semibold text-brand-muted-strong">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
              <SelectItem value="ALL" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الكل</SelectItem>
              <SelectItem value="STUDENT" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">طالب</SelectItem>
              <SelectItem value="ADMIN" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">مشرف</SelectItem>
            </SelectContent>
          </Select>
          <Select value={grade} onValueChange={(v) => { setGrade(v === 'ALL' ? '' : (v as GradeEnum)); setPage(1); }}>
            <SelectTrigger className="h-10 w-40 rounded-full border-brand-border bg-brand-surface text-sm font-semibold text-brand-muted-strong">
              <SelectValue placeholder="كل الصفوف" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
              <SelectItem value="ALL" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">كل الصفوف</SelectItem>
              <SelectItem value="FIRST_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الأول الثانوي</SelectItem>
              <SelectItem value="SECOND_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الثاني الثانوي</SelectItem>
              <SelectItem value="THIRD_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الثالث الثانوي</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="h-10 rounded-full bg-brand-primary px-5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
            onClick={applySearch}
          >
            بحث
          </Button>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm font-semibold text-brand-accent">
            {error}
          </p>
        )}

        <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا يوجد مستخدمون مطابقون." variant="brand" />

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
      </div>

      {/* ── Mobile (lg:hidden) — matches the Academic Precision students frame ── */}
      <div className="lg:hidden">
        <div className="space-y-4 px-4 pb-8 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-brand-text">الطلاب</h1>
              <p className="mt-0.5 text-xs text-brand-muted">إدارة حسابات الطلاب والمشرفين</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void load()}
                aria-label="تحديث"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex h-10 items-center gap-1.5 rounded-full bg-brand-primary px-4 text-xs font-bold text-white transition-colors hover:bg-brand-primary/90 active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
                إضافة
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              dir="rtl"
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              className="w-full rounded-full border border-brand-border bg-brand-surface py-2.5 ps-3 pe-9 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/30"
            />
          </div>

          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
            {(['ALL', 'STUDENT', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setPage(1); }}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  role === r ? 'bg-brand-primary text-white' : 'border border-brand-border bg-brand-surface text-brand-muted-strong hover:bg-brand-hover',
                )}
              >
                {r === 'ALL' ? 'الكل' : ROLE_LABEL[r]}
              </button>
            ))}
            <span className="h-5 w-px shrink-0 bg-brand-border" aria-hidden="true" />
            {(['', 'FIRST_SECONDARY', 'SECOND_SECONDARY', 'THIRD_SECONDARY'] as const).map((g) => (
              <button
                key={g || 'all-grade'}
                type="button"
                onClick={() => { setGrade(g as GradeEnum); setPage(1); }}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  grade === g ? 'border border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border border-brand-border bg-brand-surface text-brand-muted-strong hover:bg-brand-hover',
                )}
              >
                {g ? GRADE_LABEL[g] : 'كل الصفوف'}
              </button>
            ))}
          </div>

          {error && <p role="alert" className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 p-3 text-xs font-semibold text-brand-accent">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl bg-brand-chip" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">لا يوجد مستخدمون مطابقون.</p>
          ) : (
            <ul className="divide-y divide-brand-border/70 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
              {rows.map((u) => (
                <li key={u.slug}>
                  <button
                    type="button"
                    onClick={() => setMobileActions(mobileActions === u.slug ? null : u.slug)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-secondary/25 text-sm font-bold text-brand-secondary">
                        {u.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-brand-text">{u.name || '—'}</p>
                        <p dir="ltr" className="truncate text-end text-[11px] text-brand-muted-strong">{u.email}</p>
                        <p className="mt-0.5 text-[10px] text-brand-muted">
                          {u.grade ? GRADE_LABEL[u.grade] ?? u.grade : '—'}
                          <span className="mx-1">·</span>
                          آخر دخول {formatDate(u.lastLoginAt)}
                        </p>
                      </div>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold', u.role === 'ADMIN' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-chip text-brand-muted-strong')}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </button>
                  {mobileActions === u.slug && (
                    <div className="flex items-center gap-2 bg-brand-chip px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => { setCourseUser(u); setNewCourseId(''); void loadCourseRows(u.slug); }}
                        className="flex items-center gap-1.5 rounded-full border border-brand-primary/25 px-3 py-1.5 text-[11px] font-semibold text-brand-primary"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> المقررات
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditing(u); setEditName(u.name || ''); setEditEmail(u.email); setEditGrade((u.grade as GradeEnum | null) ?? ''); setEditPhone(u.phoneNumber || ''); }}
                        className="flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-[11px] font-semibold text-brand-muted-strong"
                      >
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(u)}
                        className="flex items-center gap-1.5 rounded-full border border-brand-accent/30 px-3 py-1.5 text-[11px] font-semibold text-brand-accent"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-brand-muted">عرض {rangeLabel} من {total}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-9 items-center rounded-full border border-brand-border bg-brand-surface px-3 text-xs font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover disabled:opacity-40"
              >
                السابق
              </button>
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-muted-strong">
                {page} / {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-9 items-center rounded-full border border-brand-border bg-brand-surface px-3 text-xs font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={(open) => { if (!open && !addBusy) setAddOpen(false); }}>
        <DialogContent className="rounded-2xl border-brand-border bg-brand-surface text-brand-text">
          <DialogHeader>
            <DialogTitle className="text-brand-text">إضافة طالب جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-name" className="text-brand-muted-strong">الاسم *</Label>
              <Input id="add-name" dir="rtl" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-email" className="text-brand-muted-strong">البريد الإلكتروني *</Label>
              <Input id="add-email" dir="ltr" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-password" className="text-brand-muted-strong">كلمة المرور *</Label>
              <Input id="add-password" dir="ltr" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className="border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="add-phone" className="text-brand-muted-strong">رقم الهاتف</Label>
                <Input id="add-phone" dir="ltr" value={addForm.phoneNumber} onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })} className="border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-brand-muted-strong">الصف *</Label>
                <Select value={addForm.grade} onValueChange={(v) => setAddForm({ ...addForm, grade: v as GradeEnum })}>
                  <SelectTrigger className="border-brand-border bg-brand-surface text-brand-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
                    <SelectItem value="FIRST_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الأول الثانوي</SelectItem>
                    <SelectItem value="SECOND_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الثاني الثانوي</SelectItem>
                    <SelectItem value="THIRD_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الثالث الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full border-brand-border bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text" onClick={() => setAddOpen(false)} disabled={addBusy}>إلغاء</Button>
            <Button className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90" onClick={() => void doAddStudent()} disabled={addBusy || !addForm.name.trim() || !addForm.email.trim() || addForm.password.length < 6}>
              {addBusy ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="rounded-2xl border-brand-border bg-brand-surface text-brand-text">
          <DialogHeader>
            <DialogTitle className="text-brand-text">تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-brand-muted-strong">الاسم</Label>
              <Input id="edit-name" dir="rtl" value={editName} onChange={(e) => setEditName(e.target.value)} className="border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-brand-muted-strong">البريد الإلكتروني</Label>
              <Input id="edit-email" dir="ltr" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-brand-muted-strong">الصف</Label>
                <Select value={editGrade || 'ALL'} onValueChange={(v) => setEditGrade(v === 'ALL' ? '' : (v as GradeEnum))}>
                  <SelectTrigger className="border-brand-border bg-brand-surface text-brand-text">
                    <SelectValue placeholder="بدون تغيير" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
                    <SelectItem value="ALL" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">بدون تغيير</SelectItem>
                    <SelectItem value="FIRST_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الأول الثانوي</SelectItem>
                    <SelectItem value="SECOND_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الثاني الثانوي</SelectItem>
                    <SelectItem value="THIRD_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الثالث الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-brand-muted-strong">رقم الهاتف</Label>
                <Input id="edit-phone" dir="ltr" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full border-brand-border bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text" onClick={() => setEditing(null)} disabled={editBusy}>إلغاء</Button>
            <Button className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90" onClick={() => void saveEdit()} disabled={editBusy || !editName.trim() || !editEmail.trim()}>
              {editBusy ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* per-student courses */}
      <Dialog open={courseUser !== null} onOpenChange={(open) => { if (!open && !courseBusy) { setCourseUser(null); setCourseRows([]); } }}>
        <DialogContent className="rounded-2xl border-brand-border bg-brand-surface text-brand-text">
          <DialogHeader>
            <DialogTitle className="text-brand-text">مقررات {courseUser?.name || courseUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {courseLoading ? (
              <p className="py-6 text-center text-sm text-brand-muted">جارٍ التحميل...</p>
            ) : courseRows.length === 0 ? (
              <p className="py-4 text-center text-sm text-brand-muted">لا يوجد تسجيل في أي مقرر بعد.</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {courseRows.map((enr) => (
                  <div key={enr.id} className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-chip p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-brand-text">{enr.course.title}</p>
                      <p className="mt-0.5 text-[11px] text-brand-muted">
                        التقدم: {Math.round(enr.progress * 100)}% · {enr.isPaid ? 'مدفوع' : 'غير مدفوع'}
                        {enr.isCompleted ? ' · مكتمل' : ''}
                      </p>
                    </div>
                    <button type="button" title="إلغاء التسجيل" disabled={courseBusy} onClick={() => void doUnenroll(enr)} className="rounded-full border border-brand-accent/30 p-2 text-brand-accent transition-colors duration-150 hover:bg-brand-accent hover:text-white disabled:opacity-40">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-brand-muted-strong">تسجيل في مقرر</Label>
              <div className="flex items-center gap-2">
                <Select value={newCourseId} onValueChange={setNewCourseId}>
                  <SelectTrigger className="flex-1 border-brand-border bg-brand-surface text-brand-text">
                    <SelectValue placeholder="اختر المقرر" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-xl border-brand-border bg-brand-surface text-brand-text">
                    {allCourses.map((course) => (
                      <SelectItem key={course.slug} value={course.slug} className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90" onClick={() => void doEnroll()} disabled={courseBusy || !newCourseId}>
                  <Plus className="me-1.5 h-4 w-4" />
                  تسجيل
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full border-brand-border bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text" onClick={() => { setCourseUser(null); setCourseRows([]); }} disabled={courseBusy}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title="حذف الطالب"
        description={`هل أنت متأكد من حذف "${deleting?.name || deleting?.email}"؟ سيتم حذف تقدمه واشتراكاته ومحاولاته نهائيًا. لا يمكن التراجع عن هذه الخطوة.`}
        confirmLabel="حذف نهائيًا"
        busy={deleteBusy}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        onConfirm={() => void confirmDelete()}
        variant="brand"
      />
    </div>
  );
}