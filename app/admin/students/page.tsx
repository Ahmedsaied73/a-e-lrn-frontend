'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { BookOpen, ChevronDown, ChevronsUpDown, ChevronUp, Pencil, Plus, RefreshCw, Search, Trash2, UserPlus, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-on-surface">
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
        cell: ({ row }) => <span className="font-semibold text-on-surface">{row.original.name || '—'}</span>,
      },
      { accessorKey: 'email', header: 'البريد الإلكتروني', cell: ({ row }) => <span dir="ltr" className="text-on-surface-variant">{row.original.email}</span> },
      {
        accessorKey: 'grade',
        header: 'الصف',
        cell: ({ row }) => <span className="text-on-surface-variant">{row.original.grade ? GRADE_LABEL[row.original.grade] ?? row.original.grade : '—'}</span>,
      },
      {
        accessorKey: 'role',
        header: 'النوع',
        cell: ({ row }) => (
          <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', row.original.role === 'ADMIN' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-outline-variant bg-slate-100 text-on-surface-variant')}>
            {ROLE_LABEL[row.original.role] ?? row.original.role}
          </span>
        ),
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'آخر دخول',
        cell: ({ row }) => <span className="text-on-surface-variant">{formatDate(row.original.lastLoginAt)}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: () => <SortableHeader label="تاريخ الإنشاء" sortKey="createdAt" sort={sort} onSort={onSortChange} />,
        cell: ({ row }) => <span className="text-on-surface-variant">{new Date(row.original.createdAt).toLocaleDateString('ar-EG')}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button type="button" title="المقررات" onClick={() => { setCourseUser(row.original); setNewCourseId(''); void loadCourseRows(row.original.slug); }} className="rounded-lg border border-sky-500/40 p-2 text-sky-700 transition-colors duration-150 hover:border-sky-400 hover:text-sky-200">
              <BookOpen className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="تعديل" onClick={() => { setEditing(row.original); setEditName(row.original.name || ''); setEditEmail(row.original.email); setEditGrade((row.original.grade as GradeEnum | null) ?? ''); setEditPhone(row.original.phoneNumber || ''); }} className="rounded-lg border border-outline-variant p-2 text-on-surface-variant transition-colors duration-150 hover:border-primary-color hover:text-on-surface">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="حذف" onClick={() => setDeleting(row.original)} className="rounded-lg border border-red-200 p-2 text-red-600 transition-colors duration-150 hover:border-red-400 hover:bg-red-50">
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
      <div className="hidden space-y-6 lg:block">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">الطلاب</h1>
          <p className="mt-1 text-sm text-on-surface-variant">إدارة حسابات الطلاب والمشرفين — {total} مستخدم.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-primary-color hover:text-on-surface" onClick={() => void load()}>
            <RefreshCw className="mr-0 h-4 w-4" />
            تحديث
          </Button>
          <Button className="bg-primary-color text-white hover:bg-[#0057c0]" onClick={() => setAddOpen(true)}>
            <UserPlus className="mr-0 h-4 w-4" />
            إضافة طالب
          </Button>
        </div>
      </div>

      <Card className="border-outline-variant/70 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-on-surface/80">بحث وعوامل تصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
              <Input
                dir="rtl"
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                className="border-outline-variant bg-white pr-9 text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:ring-2 focus:ring-primary-color/20"
              />
            </div>
            <Select value={role} onValueChange={(v) => { setRole(v as typeof role); setPage(1); }}>
              <SelectTrigger className="w-40 border-outline-variant bg-white text-on-surface">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent className="border-outline-variant bg-card text-on-surface">
                <SelectItem value="ALL">الكل</SelectItem>
                <SelectItem value="STUDENT">طالب</SelectItem>
                <SelectItem value="ADMIN">مشرف</SelectItem>
              </SelectContent>
            </Select>
            <Select value={grade} onValueChange={(v) => { setGrade(v === 'ALL' ? '' : (v as GradeEnum)); setPage(1); }}>
              <SelectTrigger className="w-40 border-outline-variant bg-white text-on-surface">
                <SelectValue placeholder="كل الصفوف" />
              </SelectTrigger>
              <SelectContent className="border-outline-variant bg-card text-on-surface">
                <SelectItem value="ALL">كل الصفوف</SelectItem>
                <SelectItem value="FIRST_SECONDARY">الأول الثانوي</SelectItem>
                <SelectItem value="SECOND_SECONDARY">الثاني الثانوي</SelectItem>
                <SelectItem value="THIRD_SECONDARY">الثالث الثانوي</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-primary-color text-white hover:bg-[#0057c0]" onClick={applySearch}>
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا يوجد مستخدمون مطابقون." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          عرض {rangeLabel} من {total}
        </p>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-28 border-outline-variant bg-white text-on-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-outline-variant bg-card text-on-surface">
              {[10, 15, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n} / صفحة</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-primary-color hover:text-on-surface" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            السابق
          </Button>
          <span className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-sm text-on-surface-variant">
            صفحة {page} / {Math.max(1, totalPages)}
          </span>
          <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-primary-color hover:text-on-surface" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
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
              <h1 className="text-lg font-bold text-on-surface">الطلاب</h1>
              <p className="mt-0.5 text-xs text-on-surface-variant">إدارة حسابات الطلاب والمشرفين</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void load()}
                aria-label="تحديث"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/70 bg-surface-container-lowest text-on-surface-variant transition-transform active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex h-10 items-center gap-1.5 rounded-full bg-primary-color px-4 text-xs font-bold text-white transition-transform active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
                إضافة
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
            <input
              dir="rtl"
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              className="w-full rounded-2xl border border-outline-variant/70 bg-surface-container-lowest py-2.5 pl-3 pr-9 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:outline-hidden focus:ring-2 focus:ring-primary-color/20"
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
                  role === r ? 'bg-primary-color text-white' : 'border border-outline-variant/70 bg-surface-container-lowest text-on-surface-variant',
                )}
              >
                {r === 'ALL' ? 'الكل' : ROLE_LABEL[r]}
              </button>
            ))}
            <span className="h-5 w-px shrink-0 bg-outline-variant/60" aria-hidden="true" />
            {(['', 'FIRST_SECONDARY', 'SECOND_SECONDARY', 'THIRD_SECONDARY'] as const).map((g) => (
              <button
                key={g || 'all-grade'}
                type="button"
                onClick={() => { setGrade(g as GradeEnum); setPage(1); }}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  grade === g ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'border border-outline-variant/70 bg-surface-container-lowest text-on-surface-variant',
                )}
              >
                {g ? GRADE_LABEL[g] : 'كل الصفوف'}
              </button>
            ))}
          </div>

          {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-on-surface-variant">لا يوجد مستخدمون مطابقون.</p>
          ) : (
            <ul className="divide-y divide-outline-variant/40 overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest">
              {rows.map((u) => (
                <li key={u.slug}>
                  <button
                    type="button"
                    onClick={() => setMobileActions(mobileActions === u.slug ? null : u.slug)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-right"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-sm font-bold text-on-primary-fixed-variant">
                        {u.name.trim().charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-on-surface">{u.name || '—'}</p>
                        <p dir="ltr" className="truncate text-right text-[11px] text-on-surface-variant">{u.email}</p>
                        <p className="mt-0.5 text-[10px] text-on-surface-variant/70">
                          {u.grade ? GRADE_LABEL[u.grade] ?? u.grade : '—'}
                          <span className="mx-1">·</span>
                          آخر دخول {formatDate(u.lastLoginAt)}
                        </p>
                      </div>
                    </div>
                    <span className={cn('shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold', u.role === 'ADMIN' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-outline-variant bg-slate-100 text-on-surface-variant')}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </button>
                  {mobileActions === u.slug && (
                    <div className="flex items-center gap-2 bg-surface px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => { setCourseUser(u); setNewCourseId(''); void loadCourseRows(u.slug); }}
                        className="flex items-center gap-1.5 rounded-full border border-sky-500/40 px-3 py-1.5 text-[11px] font-semibold text-sky-700"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> المقررات
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditing(u); setEditName(u.name || ''); setEditEmail(u.email); setEditGrade((u.grade as GradeEnum | null) ?? ''); setEditPhone(u.phoneNumber || ''); }}
                        className="flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant"
                      >
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(u)}
                        className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-600"
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
            <p className="text-[11px] text-on-surface-variant">عرض {rangeLabel} من {total}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-9 items-center rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface disabled:opacity-40"
              >
                السابق
              </button>
              <span className="rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface-variant">
                {page} / {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-9 items-center rounded-full border border-outline-variant/70 bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={(open) => { if (!open && !addBusy) setAddOpen(false); }}>
        <DialogContent className="border-outline-variant/70 bg-card text-on-surface">
          <DialogHeader>
            <DialogTitle className="text-on-surface">إضافة طالب جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-name" className="text-on-surface/80">الاسم *</Label>
              <Input id="add-name" dir="rtl" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:ring-2 focus:ring-primary-color/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-email" className="text-on-surface/80">البريد الإلكتروني *</Label>
              <Input id="add-email" dir="ltr" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:ring-2 focus:ring-primary-color/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-password" className="text-on-surface/80">كلمة المرور *</Label>
              <Input id="add-password" dir="ltr" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:ring-2 focus:ring-primary-color/20" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="add-phone" className="text-on-surface/80">رقم الهاتف</Label>
                <Input id="add-phone" dir="ltr" value={addForm.phoneNumber} onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:ring-2 focus:ring-primary-color/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-on-surface/80">الصف *</Label>
                <Select value={addForm.grade} onValueChange={(v) => setAddForm({ ...addForm, grade: v as GradeEnum })}>
                  <SelectTrigger className="border-outline-variant bg-white text-on-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-outline-variant bg-card text-on-surface">
                    <SelectItem value="FIRST_SECONDARY">الأول الثانوي</SelectItem>
                    <SelectItem value="SECOND_SECONDARY">الثاني الثانوي</SelectItem>
                    <SelectItem value="THIRD_SECONDARY">الثالث الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-primary-color hover:text-on-surface" onClick={() => setAddOpen(false)} disabled={addBusy}>إلغاء</Button>
            <Button className="bg-primary-color text-white hover:bg-[#0057c0]" onClick={() => void doAddStudent()} disabled={addBusy || !addForm.name.trim() || !addForm.email.trim() || addForm.password.length < 6}>
              {addBusy ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="border-outline-variant/70 bg-card text-on-surface">
          <DialogHeader>
            <DialogTitle className="text-on-surface">تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-on-surface/80">الاسم</Label>
              <Input id="edit-name" dir="rtl" value={editName} onChange={(e) => setEditName(e.target.value)} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:ring-2 focus:ring-primary-color/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-on-surface/80">البريد الإلكتروني</Label>
              <Input id="edit-email" dir="ltr" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:ring-2 focus:ring-primary-color/20" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-on-surface/80">الصف</Label>
                <Select value={editGrade || 'ALL'} onValueChange={(v) => setEditGrade(v === 'ALL' ? '' : (v as GradeEnum))}>
                  <SelectTrigger className="border-outline-variant bg-white text-on-surface">
                    <SelectValue placeholder="بدون تغيير" />
                  </SelectTrigger>
                  <SelectContent className="border-outline-variant bg-card text-on-surface">
                    <SelectItem value="ALL">بدون تغيير</SelectItem>
                    <SelectItem value="FIRST_SECONDARY">الأول الثانوي</SelectItem>
                    <SelectItem value="SECOND_SECONDARY">الثاني الثانوي</SelectItem>
                    <SelectItem value="THIRD_SECONDARY">الثالث الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-on-surface/80">رقم الهاتف</Label>
                <Input id="edit-phone" dir="ltr" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-color focus:ring-2 focus:ring-primary-color/20" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-primary-color hover:text-on-surface" onClick={() => setEditing(null)} disabled={editBusy}>إلغاء</Button>
            <Button className="bg-primary-color text-white hover:bg-[#0057c0]" onClick={() => void saveEdit()} disabled={editBusy || !editName.trim() || !editEmail.trim()}>
              {editBusy ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* per-student courses */}
      <Dialog open={courseUser !== null} onOpenChange={(open) => { if (!open && !courseBusy) { setCourseUser(null); setCourseRows([]); } }}>
        <DialogContent className="border-outline-variant/70 bg-card text-on-surface">
          <DialogHeader>
            <DialogTitle className="text-on-surface">مقررات {courseUser?.name || courseUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {courseLoading ? (
              <p className="py-6 text-center text-sm text-on-surface-variant">جارٍ التحميل...</p>
            ) : courseRows.length === 0 ? (
              <p className="py-4 text-center text-sm text-on-surface-variant/70">لا يوجد تسجيل في أي مقرر بعد.</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {courseRows.map((enr) => (
                  <div key={enr.id} className="flex items-center gap-2 rounded-xl border border-outline-variant/70 bg-surface p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-on-surface">{enr.course.title}</p>
                      <p className="mt-0.5 text-[11px] text-on-surface-variant/70">
                        التقدم: {Math.round(enr.progress * 100)}% · {enr.isPaid ? 'مدفوع' : 'غير مدفوع'}
                        {enr.isCompleted ? ' · مكتمل' : ''}
                      </p>
                    </div>
                    <button type="button" title="إلغاء التسجيل" disabled={courseBusy} onClick={() => void doUnenroll(enr)} className="rounded-lg border border-red-200 p-2 text-red-600 transition-colors duration-150 hover:border-red-400 hover:bg-red-50 disabled:opacity-40">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-on-surface/80">تسجيل في مقرر</Label>
              <div className="flex items-center gap-2">
                <Select value={newCourseId} onValueChange={setNewCourseId}>
                  <SelectTrigger className="flex-1 border-outline-variant bg-white text-on-surface">
                    <SelectValue placeholder="اختر المقرر" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 border-outline-variant bg-card text-on-surface">
                    {allCourses.map((course) => (
                      <SelectItem key={course.slug} value={course.slug}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="bg-primary-color text-white hover:bg-[#0057c0]" onClick={() => void doEnroll()} disabled={courseBusy || !newCourseId}>
                  <Plus className="mr-0 h-4 w-4" />
                  تسجيل
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-primary-color hover:text-on-surface" onClick={() => { setCourseUser(null); setCourseRows([]); }} disabled={courseBusy}>إغلاق</Button>
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
      />
    </div>
  );
}