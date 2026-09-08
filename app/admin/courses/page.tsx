'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { Film, Pencil, Plus, RefreshCw, Search, Trash2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

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

  const [mobileActions, setMobileActions] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCourses({ page, limit: pageSize, search: search || undefined });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      if (page > res.meta.totalPages) setPage(Math.max(1, res.meta.totalPages));
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
        cell: ({ row }) => <span className="font-semibold text-on-surface">{row.original.title}</span>,
      },
      {
        accessorKey: 'grade',
        header: 'الصف',
        cell: ({ row }) => <span className="text-on-surface-variant">{GRADE_LABEL[row.original.grade] ?? row.original.grade}</span>,
      },
      {
        accessorKey: 'category',
        header: 'التصنيف',
        cell: ({ row }) => <span className="text-on-surface-variant">{row.original.category || '—'}</span>,
      },
      {
        accessorKey: '_count.videos',
        header: 'الفيديوهات',
        cell: ({ row }) => <span className="text-on-surface-variant">{row.original._count.videos}</span>,
      },
      {
        accessorKey: '_count.enrollments',
        header: 'الطلاب',
        cell: ({ row }) => <span className="text-on-surface-variant">{row.original._count.enrollments}</span>,
      },
      {
        accessorKey: 'price',
        header: 'السعر',
        cell: ({ row }) => <span className="text-on-surface-variant">{row.original.price != null ? `${row.original.price} ج.م` : '—'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'تاريخ الإنشاء',
        cell: ({ row }) => <span className="text-on-surface-variant">{formatDate(row.original.createdAt)}</span>,
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
              className="rounded-lg border border-sky-500/40 p-2 text-sky-700 transition-colors duration-150 hover:border-sky-400 hover:text-sky-200"
            >
              <Film className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="تعديل"
              onClick={() => openEdit(row.original)}
              className="rounded-lg border border-outline-variant p-2 text-on-surface-variant transition-colors duration-150 hover:border-[#207bff] hover:text-on-surface"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="حذف"
              onClick={() => setDeleting(row.original)}
              className="rounded-lg border border-red-200 p-2 text-red-600 transition-colors duration-150 hover:border-red-400 hover:bg-red-50"
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

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1); };
  const rangeLabel = total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`;

  const set = (key: keyof CourseFormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="hidden space-y-6 lg:block">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">الدورات</h1>
          <p className="mt-1 text-sm text-on-surface-variant">إدارة الدورات وفيديوهاتها — {total} دورة.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-[#207bff] hover:text-on-surface" onClick={() => void load()}>
            <RefreshCw className="mr-0 h-4 w-4" />
            تحديث
          </Button>
          <Button className="bg-[#207bff] text-white hover:bg-[#0057c0]" onClick={openCreate}>
            <Plus className="mr-0 h-4 w-4" />
            دورة جديدة
          </Button>
        </div>
      </div>

      <Card className="border-outline-variant/70 bg-card">
        <CardContent>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
            <Input
              dir="rtl"
              placeholder="ابحث عن دورة..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              className="border-outline-variant bg-white pr-9 text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#207bff] focus:ring-2 focus:ring-[#207bff]/20"
            />
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا توجد دورات مطابقة." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">عرض {rangeLabel} من {total}</p>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-28 border-outline-variant bg-white text-on-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-outline-variant bg-card text-on-surface">
              {[10, 15, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n} / صفحة</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-[#207bff] hover:text-on-surface" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            السابق
          </Button>
          <span className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-sm text-on-surface-variant">
            صفحة {page} / {Math.max(1, totalPages)}
          </span>
          <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-[#207bff] hover:text-on-surface" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </div>
      </div>
      </div>

      {/* ── Mobile (lg:hidden) — matches the Academic Precision courses frame ── */}
      <div className="lg:hidden">
        <div className="space-y-4 px-4 pb-8 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-on-surface">الدورات</h1>
              <p className="mt-0.5 text-xs text-on-surface-variant">إدارة الدورات وفيديوهاتها</p>
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
                onClick={openCreate}
                className="flex h-10 items-center gap-1.5 rounded-full bg-[#207bff] px-4 text-xs font-bold text-white transition-transform active:scale-95"
              >
                <Plus className="h-4 w-4" />
                جديد
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
            <input
              dir="rtl"
              placeholder="ابحث عن دورة..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              className="w-full rounded-2xl border border-outline-variant/70 bg-surface-container-lowest py-2.5 pl-3 pr-9 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20"
            />
          </div>

          {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-on-surface-variant">لا توجد دورات مطابقة.</p>
          ) : (
            <ul className="divide-y divide-outline-variant/40 overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest">
              {rows.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setMobileActions(mobileActions === c.id ? null : c.id)}
                    className="flex w-full items-start justify-between gap-2 px-4 py-3 text-right"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-[#004397]">
                        <Film className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-on-surface">{c.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-[10px] font-semibold text-[#00487f]">
                            {GRADE_LABEL[c.grade] ?? c.grade}
                          </span>
                          <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-semibold text-[#004397]">
                            {c._count.videos} فيديو
                          </span>
                          <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-semibold text-[#004395]">
                            {c._count.enrollments} طالب
                          </span>
                          {(c.category ?? '').trim() !== '' && (
                            <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                              {c.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[10px] text-on-surface-variant/70">
                          {c.price != null ? `${c.price} ج.م` : 'مجاني'} · {formatDate(c.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-on-surface-variant transition-transform', mobileActions === c.id && 'rotate-180')} aria-hidden="true" />
                  </button>
                  {mobileActions === c.id && (
                    <div className="flex items-center gap-2 bg-surface px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/courses/${c.id}/videos`)}
                        className="flex items-center gap-1.5 rounded-full border border-sky-500/40 px-3 py-1.5 text-[11px] font-semibold text-sky-700"
                      >
                        <Film className="h-3.5 w-3.5" /> الفيديوهات
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant"
                      >
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="border-outline-variant/70 bg-card text-on-surface">
          <DialogHeader>
            <DialogTitle className="text-on-surface">{editingCourse ? 'تعديل الدورة' : 'إنشاء دورة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-title" className="text-on-surface/80">العنوان *</Label>
              <Input id="course-title" dir="rtl" value={form.title} onChange={set('title')} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#207bff] focus:ring-2 focus:ring-[#207bff]/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-desc" className="text-on-surface/80">الوصف *</Label>
              <textarea
                id="course-desc"
                dir="rtl"
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="w-full resize-none rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#207bff] focus:outline-none focus:ring-2 focus:ring-[#207bff]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="course-price" className="text-on-surface/80">السعر (ج.م) *</Label>
                <Input id="course-price" dir="ltr" type="number" value={form.price} onChange={set('price')} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#207bff] focus:ring-2 focus:ring-[#207bff]/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-on-surface/80">الصف *</Label>
                <Select value={form.grade || 'ALL'} onValueChange={(v) => setForm((f) => ({ ...f, grade: v === 'ALL' ? '' : (v as GradeEnum) }))}>
                  <SelectTrigger className="border-outline-variant bg-white text-on-surface">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent className="border-outline-variant bg-card text-on-surface">
                    <SelectItem value="ALL">اختر الصف</SelectItem>
                    <SelectItem value="FIRST_SECONDARY">الأول الثانوي</SelectItem>
                    <SelectItem value="SECOND_SECONDARY">الثاني الثانوي</SelectItem>
                    <SelectItem value="THIRD_SECONDARY">الثالث الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-category" className="text-on-surface/80">التصنيف</Label>
              <Input id="course-category" dir="rtl" value={form.category} onChange={set('category')} placeholder="مثال: كيمياء" className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#207bff] focus:ring-2 focus:ring-[#207bff]/20" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-[#207bff] hover:text-on-surface" onClick={() => setDialogOpen(false)} disabled={formBusy}>إلغاء</Button>
            <Button className="bg-[#207bff] text-white hover:bg-[#0057c0]" onClick={() => void save()} disabled={formBusy}>
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
