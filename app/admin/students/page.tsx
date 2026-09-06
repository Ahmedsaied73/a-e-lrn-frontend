'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { ChevronDown, ChevronsUpDown, ChevronUp, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteAdminUser, getAdminUsers, updateAdminUser } from '@/services/adminUsersService';
import type { AdminUser } from '@/types/admin';
import type { GradeEnum } from '@/types/api';
import { cn } from '@/lib/utils';

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
    <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-slate-100">
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

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBusy, setEditBusy] = useState(false);

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
      { accessorKey: 'id', header: 'الرقم', size: 70 },
      {
        accessorKey: 'name',
        header: () => <SortableHeader label="الاسم" sortKey="name" sort={sort} onSort={onSortChange} />,
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.name || '—'}</span>,
      },
      { accessorKey: 'email', header: 'البريد الإلكتروني', cell: ({ row }) => <span dir="ltr" className="text-slate-300">{row.original.email}</span> },
      {
        accessorKey: 'grade',
        header: 'الصف',
        cell: ({ row }) => <span className="text-slate-300">{row.original.grade ? GRADE_LABEL[row.original.grade] ?? row.original.grade : '—'}</span>,
      },
      {
        accessorKey: 'role',
        header: 'النوع',
        cell: ({ row }) => (
          <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', row.original.role === 'ADMIN' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-slate-600 bg-slate-700/40 text-slate-300')}>
            {ROLE_LABEL[row.original.role] ?? row.original.role}
          </span>
        ),
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'آخر دخول',
        cell: ({ row }) => <span className="text-slate-400">{formatDate(row.original.lastLoginAt)}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: () => <SortableHeader label="تاريخ الإنشاء" sortKey="createdAt" sort={sort} onSort={onSortChange} />,
        cell: ({ row }) => <span className="text-slate-400">{new Date(row.original.createdAt).toLocaleDateString('ar-EG')}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button type="button" title="تعديل" onClick={() => { setEditing(row.original); setEditName(row.original.name || ''); setEditEmail(row.original.email); }} className="rounded-lg border border-slate-600 p-2 text-slate-300 transition-colors duration-150 hover:border-slate-400 hover:text-slate-100">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="حذف" onClick={() => setDeleting(row.original)} className="rounded-lg border border-red-500/40 p-2 text-red-300 transition-colors duration-150 hover:border-red-400 hover:text-red-200">
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

  const applySearch = () => setSearch(searchInput.trim());

  const saveEdit = async () => {
    if (!editing) return;
    setEditBusy(true);
    try {
      const updated = await updateAdminUser(editing.id, { name: editName, email: editEmail });
      setRows((current) => current.map((r) => (r.id === editing.id ? { ...r, ...updated } : r)));
      toast.success('تم تحديث بيانات الطالب.');
      setEditing(null);
    } catch {
      toast.error('فشل تحديث البيانات.');
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteAdminUser(deleting.id);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">الطلاب</h1>
          <p className="mt-1 text-sm text-slate-400">إدارة حسابات الطلاب والمشرفين — {total} مستخدم.</p>
        </div>
        <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => void load()}>
          <RefreshCw className="mr-0 h-4 w-4" />
          تحديث
        </Button>
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
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                className="border-slate-700 bg-slate-900/50 pr-9 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
            <Select value={role} onValueChange={(v) => { setRole(v as typeof role); setPage(1); }}>
              <SelectTrigger className="w-40 border-slate-700 bg-slate-900/50 text-slate-100">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-card text-slate-100">
                <SelectItem value="ALL">الكل</SelectItem>
                <SelectItem value="STUDENT">طالب</SelectItem>
                <SelectItem value="ADMIN">مشرف</SelectItem>
              </SelectContent>
            </Select>
            <Select value={grade} onValueChange={(v) => { setGrade(v === 'ALL' ? '' : (v as GradeEnum)); setPage(1); }}>
              <SelectTrigger className="w-40 border-slate-700 bg-slate-900/50 text-slate-100">
                <SelectValue placeholder="كل الصفوف" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-card text-slate-100">
                <SelectItem value="ALL">كل الصفوف</SelectItem>
                <SelectItem value="FIRST_SECONDARY">الأول الثانوي</SelectItem>
                <SelectItem value="SECOND_SECONDARY">الثاني الثانوي</SelectItem>
                <SelectItem value="THIRD_SECONDARY">الثالث الثانوي</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={applySearch}>
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{error}</p>}

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا يوجد مستخدمون مطابقون." />

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

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="border-slate-700/60 bg-card text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-slate-200">الاسم</Label>
              <Input id="edit-name" dir="rtl" value={editName} onChange={(e) => setEditName(e.target.value)} className="border-slate-700 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-slate-200">البريد الإلكتروني</Label>
              <Input id="edit-email" dir="ltr" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="border-slate-700 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => setEditing(null)} disabled={editBusy}>إلغاء</Button>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={() => void saveEdit()} disabled={editBusy || !editName.trim() || !editEmail.trim()}>
              {editBusy ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </Button>
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