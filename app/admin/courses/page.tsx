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
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

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

  const [mobileActions, setMobileActions] = useState<string | null>(null);

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
        const updated = await updateAdminCourse(editingCourse.slug, payload);
        setRows((current) => current.map((c) => (c.slug === editingCourse.slug ? { ...c, ...updated, _count: c._count } : c)));
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
      await deleteAdminCourse(deleting.slug);
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
      { accessorKey: 'slug', header: 'الرقم', size: 70 },
      {
        accessorKey: 'title',
        header: 'العنوان',
        cell: ({ row }) => <span className="font-semibold text-brand-text">{row.original.title}</span>,
      },
      {
        accessorKey: 'grade',
        header: 'الصف',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted-strong">{GRADE_LABEL[row.original.grade] ?? row.original.grade}</span>,
      },
      {
        accessorKey: 'category',
        header: 'التصنيف',
        cell: ({ row }) => <span className="text-brand-muted">{row.original.category || '—'}</span>,
      },
      {
        accessorKey: '_count.videos',
        header: 'الفيديوهات',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{row.original._count.videos}</span>,
      },
      {
        accessorKey: '_count.enrollments',
        header: 'الطلاب',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{row.original._count.enrollments}</span>,
      },
      {
        accessorKey: 'price',
        header: 'السعر',
        cell: ({ row }) => (
          <span
            className={cn(
              'whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold',
              row.original.price != null ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-chip text-brand-muted-strong',
            )}
          >
            {row.original.price != null ? `${row.original.price} ج.م` : 'مجاني'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاريخ الإنشاء',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              title="الفيديوهات"
              onClick={() => router.push(`/admin/courses/${row.original.slug}/videos`)}
              className="rounded-full border border-brand-primary/25 p-2 text-brand-primary transition-colors duration-150 hover:bg-brand-primary hover:text-white"
            >
              <Film className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="تعديل"
              onClick={() => openEdit(row.original)}
              className="rounded-full border border-brand-border p-2 text-brand-muted-strong transition-colors duration-150 hover:bg-brand-hover hover:text-brand-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="حذف"
              onClick={() => setDeleting(row.original)}
              className="rounded-full border border-brand-accent/30 p-2 text-brand-accent transition-colors duration-150 hover:bg-brand-accent hover:text-white"
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
      <PageTitle title={adminTitle('الدورات')} />
      <div className="hidden space-y-5 lg:block">
      {/* Section header — eyebrow / heading / sub-copy, then the page actions. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">المحتوى التعليمي</p>
          <h1 className="mt-1 text-xl font-extrabold text-brand-text">الدورات</h1>
          <p className="mt-1 text-sm text-brand-muted">إدارة الدورات وفيديوهاتها — {total} دورة.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-1.5 rounded-full border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
            onClick={() => void load()}
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button
            className="gap-1.5 rounded-full bg-brand-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            دورة جديدة
          </Button>
        </div>
      </div>

      {/* Filter bar — the design's rounded-full search field + solid pill action. */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <Input
            dir="rtl"
            placeholder="ابحث عن دورة..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
            className="rounded-full border-brand-border bg-brand-surface pe-10 text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30"
          />
        </div>
        <Button
          className="rounded-full bg-brand-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
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

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا توجد دورات مطابقة." variant="brand" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-brand-muted">عرض {rangeLabel} من {total}</p>
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

      {/* ── Mobile (lg:hidden) — the design's stacked course cards ── */}
      <div className="lg:hidden">
        <div className="space-y-4 px-4 pb-8 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-brand-text">الدورات</h1>
              <p className="mt-0.5 text-xs text-brand-muted">إدارة الدورات وفيديوهاتها</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void load()}
                aria-label="تحديث"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-brand-muted-strong transition-colors active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="flex h-10 items-center gap-1.5 rounded-full bg-brand-primary px-4 text-xs font-bold text-white transition-colors hover:bg-brand-primary/90 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                جديد
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              dir="rtl"
              placeholder="ابحث عن دورة..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              className="w-full rounded-full border border-brand-border bg-brand-surface py-2.5 pe-10 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-xs font-semibold text-brand-accent">
              {error}
            </p>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl bg-brand-chip" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">لا توجد دورات مطابقة.</p>
          ) : (
            <ul className="divide-y divide-brand-border overflow-hidden rounded-2xl border border-brand-border bg-brand-surface">
              {rows.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => setMobileActions(mobileActions === c.slug ? null : c.slug)}
                    className="flex w-full items-start justify-between gap-2 px-4 py-3 text-start"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                        <Film className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-text">{c.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-brand-chip px-2 py-0.5 text-[10px] font-semibold text-brand-muted-strong">
                            {GRADE_LABEL[c.grade] ?? c.grade}
                          </span>
                          <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                            {c._count.videos} فيديو
                          </span>
                          <span className="rounded-full bg-brand-chip px-2 py-0.5 text-[10px] font-semibold text-brand-muted-strong">
                            {c._count.enrollments} طالب
                          </span>
                          {(c.category ?? '').trim() !== '' && (
                            <span className="rounded-full bg-brand-chip px-2 py-0.5 text-[10px] font-medium text-brand-muted">
                              {c.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-brand-muted">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 font-bold',
                              c.price != null ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-chip text-brand-muted-strong',
                            )}
                          >
                            {c.price != null ? `${c.price} ج.م` : 'مجاني'}
                          </span>
                          {formatDate(c.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-brand-muted transition-transform', mobileActions === c.slug && 'rotate-180')} aria-hidden="true" />
                  </button>
                  {mobileActions === c.slug && (
                    <div className="flex items-center gap-2 bg-brand-bg px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/courses/${c.slug}/videos`)}
                        className="flex items-center gap-1.5 rounded-full border border-brand-primary/25 px-3 py-1.5 text-[11px] font-semibold text-brand-primary"
                      >
                        <Film className="h-3.5 w-3.5" /> الفيديوهات
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-[11px] font-semibold text-brand-muted-strong"
                      >
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(c)}
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
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs text-brand-muted-strong">
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="sm:rounded-2xl border-brand-border bg-brand-surface text-brand-text">
          <DialogHeader>
            <DialogTitle className="text-brand-text">{editingCourse ? 'تعديل الدورة' : 'إنشاء دورة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-title" className="text-brand-muted-strong">العنوان *</Label>
              <Input id="course-title" dir="rtl" value={form.title} onChange={set('title')} className="rounded-xl border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-desc" className="text-brand-muted-strong">الوصف *</Label>
              <textarea
                id="course-desc"
                dir="rtl"
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="w-full resize-none rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="course-price" className="text-brand-muted-strong">السعر (ج.م) *</Label>
                <Input id="course-price" dir="ltr" type="number" value={form.price} onChange={set('price')} className="rounded-xl border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-brand-muted-strong">الصف *</Label>
                <Select value={form.grade || 'ALL'} onValueChange={(v) => setForm((f) => ({ ...f, grade: v === 'ALL' ? '' : (v as GradeEnum) }))}>
                  <SelectTrigger className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
                    <SelectItem value="ALL" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">اختر الصف</SelectItem>
                    <SelectItem value="FIRST_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الأول الثانوي</SelectItem>
                    <SelectItem value="SECOND_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الثاني الثانوي</SelectItem>
                    <SelectItem value="THIRD_SECONDARY" className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">الثالث الثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-category" className="text-brand-muted-strong">التصنيف</Label>
              <Input id="course-category" dir="rtl" value={form.category} onChange={set('category')} placeholder="مثال: كيمياء" className="rounded-xl border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20" />
            </div>
          </div>
          <DialogFooter className="gap-2.5">
            <Button
              variant="outline"
              className="rounded-full border-brand-border bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
              onClick={() => setDialogOpen(false)}
              disabled={formBusy}
            >
              إلغاء
            </Button>
            <Button
              className="rounded-full bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
              onClick={() => void save()}
              disabled={formBusy}
            >
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
        variant="brand"
      />
    </div>
  );
}
