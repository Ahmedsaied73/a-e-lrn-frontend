'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { Film, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import {
  createAdminCourse,
  deleteAdminCourse,
  getAdminCourses,
  updateAdminCourse,
} from '@/services/adminCoursesService';
import type { AdminCourse } from '@/types/admin';
import type { GradeEnum } from '@/types/api';

const GRADE_LABEL: Record<string, string> = {
  FIRST_SECONDARY: 'الأول الثانوي',
  SECOND_SECONDARY: 'الثاني الثانوي',
  THIRD_SECONDARY: 'الثالث الثانوي',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ar-EG');
}

interface CourseFormState {
  title: string;
  description: string;
  price: string;
  grade: GradeEnum | '';
  category: string;
}

const EMPTY_FORM: CourseFormState = { title: '', description: '', price: '', grade: '', category: '' };

export default function AdminCoursesPage() {
  const router = useRouter();

  const [rows, setRows] = useState<AdminCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [form, setForm] = useState<CourseFormState>(EMPTY_FORM);
  const [formBusy, setFormBusy] = useState(false);

  const [deleting, setDeleting] = useState<AdminCourse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCourses({ page, limit: pageSize, search: search || undefined });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('تعذر تحميل الدورات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (course: AdminCourse) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: course.description ?? '',
      price: course.price != null ? String(course.price) : '',
      grade: course.grade,
      category: course.category ?? '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || form.price === '' || !form.grade) {
      toast.error('يرجى إدخال العنوان والوصف والسعر والصف.');
      return;
    }
    setFormBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        grade: form.grade as GradeEnum,
        category: form.category.trim() || undefined,
      };
      if (editingCourse) {
        const updated = await updateAdminCourse(editingCourse.id, payload);
        setRows((current) => current.map((c) => (c.id === editingCourse.id ? { ...c, ...updated, _count: c._count } : c)));
        toast.success('تم تحديث الدورة.');
      } else {
        await createAdminCourse(payload);
        toast.success('تم إنشاء الدورة.');
        setPage(1);
        void load();
      }
      setDialogOpen(false);
    } catch {
      toast.error('فشل حفظ الدورة.');
    } finally {
      setFormBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteAdminCourse(deleting.id);
      toast.success('تم حذف الدورة.');
      setDeleting(null);
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر حذف الدورة.');
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const columns = useMemo<ColumnDef<AdminCourse>[]>(
    () => [
      { accessorKey: 'id', header: 'الرقم', size: 70 },
      {
        accessorKey: 'title',
        header: 'العنوان',
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.title}</span>,
      },
      {
        accessorKey: 'grade',
        header: 'الصف',
        cell: ({ row }) => <span className="text-slate-300">{GRADE_LABEL[row.original.grade] ?? row.original.grade}</span>,
      },
      {
        accessorKey: 'category',
        header: 'التصنيف',
        cell: ({ row }) => <span className="text-slate-300">{row.original.category || '—'}</span>,
      },
      {
        accessorKey: '_count.videos',
        header: 'الفيديوهات',
        cell: ({ row }) => <span className="text-slate-300">{row.original._count.videos}</span>,
      },
      {
        accessorKey: '_count.enrollments',
        header: 'الطلاب',
        cell: ({ row }) => <span className="text-slate-300">{row.original._count.enrollments}</span>,
      },
      {
        accessorKey: 'price',
        header: 'السعر',
        cell: ({ row }) => <span className="text-slate-300">{row.original.price != null ? `${row.original.price} ج.م` : '—'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'تاريخ الإنشاء',
        cell: ({ row }) => <span className="text-slate-400">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              title="الفيديوهات"
              onClick={() => router.push(`/admin/courses/${row.original.id}/videos`)}
              className="rounded-lg border border-sky-500/40 p-2 text-sky-300 transition-colors duration-150 hover:border-sky-400 hover:text-sky-200"
            >
              <Film className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="تعديل"
              onClick={() => openEdit(row.original)}
              className="rounded-lg border border-slate-600 p-2 text-slate-300 transition-colors duration-150 hover:border-slate-400 hover:text-slate-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="حذف"
              onClick={() => setDeleting(row.original)}
              className="rounded-lg border border-red-500/40 p-2 text-red-300 transition-colors duration-150 hover:border-red-400 hover:text-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const applySearch = () => setSearch(searchInput.trim());
  const rangeLabel = total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`;

  const set = (key: keyof CourseFormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">الدورات</h1>
          <p className="mt-1 text-sm text-slate-400">إدارة الدورات وفيديوهاتها — {total} دورة.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => void load()}>
            <RefreshCw className="mr-0 h-4 w-4" />
            تحديث
          </Button>
          <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={openCreate}>
            <Plus className="mr-0 h-4 w-4" />
            دورة جديدة
          </Button>
        </div>
      </div>

      <Card className="border-slate-700/60 bg-card">
        <CardContent>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              dir="rtl"
              placeholder="ابحث عن دورة..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              className="border-slate-700 bg-slate-900/50 pr-9 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{error}</p>}

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا توجد دورات مطابقة." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">عرض {rangeLabel} من {total}</p>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="border-slate-700/60 bg-card text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">{editingCourse ? 'تعديل الدورة' : 'إنشاء دورة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-title" className="text-slate-200">العنوان *</Label>
              <Input id="course-title" dir="rtl" value={form.title} onChange={set('title')} className="border-slate-700 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-desc" className="text-slate-200">الوصف *</Label>
              <textarea
                id="course-desc"
                dir="rtl"
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="course-price" className="text-slate-200">السعر (ج.م) *</Label>
                <Input id="course-price" dir="ltr" type="number" value={form.price} onChange={set('price')} className="border-slate-700 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-200">الصف *</Label>
                <Select value={form.grade || 'ALL'} onValueChange={(v) => setForm((f) => ({ ...f, grade: v === 'ALL' ? '' : (v as GradeEnum) }))}>
                  <SelectTrigger className="border-slate-700 bg-slate-900/50 text-slate-100">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-card text-slate-100">
                    <SelectItem value="ALL">اختر الصف</SelectItem>
                    <SelectItem value="FIRST_SECONDARY">الأول الثانوي</SelectItem>
                    <SelectItem value="SECOND_SECONDARY">الثاني الثانوي</SelectItem>
                    <SelectItem value="THIRD_SECONDARY">الثالث الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-category" className="text-slate-200">التصنيف</Label>
              <Input id="course-category" dir="rtl" value={form.category} onChange={set('category')} placeholder="مثال: كيمياء" className="border-slate-700 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => setDialogOpen(false)} disabled={formBusy}>إلغاء</Button>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={() => void save()} disabled={formBusy}>
              {formBusy ? 'جارٍ الحفظ...' : (editingCourse ? 'حفظ التغييرات' : 'إنشاء الدورة')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title="حذف الدورة"
        description={`هل أنت متأكد من حذف "${deleting?.title}"؟ سيتم حذف جميع الفيديوهات والاشتراكات والشهادات المرتبطة بها، وحذف الفيديوهات المرفوعة على Bunny عن بُعد. لا يمكن التراجع عن هذه الخطوة.`}
        confirmLabel="حذف نهائيًا"
        busy={deleteBusy}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
