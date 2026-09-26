'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { ClipboardList, FileQuestion, Lock, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteQuiz, listAllAdminQuizzes } from '@/services/adminQuizService';
import type { AdminQuiz } from '@/types/admin';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ar-EG');
}

export default function AdminQuizzesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminQuiz[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<AdminQuiz | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAllAdminQuizzes({ page, limit: pageSize, search: search || undefined });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      if (page > res.meta.totalPages) setPage(Math.max(1, res.meta.totalPages));
    } catch {
      setError('تعذر تحميل الاختبارات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<AdminQuiz>[]>(
    () => [
      { accessorKey: 'slug', header: 'الرقم', size: 70 },
      {
        accessorKey: 'title',
        header: 'الاختبار',
        cell: ({ row }) => <span className="font-semibold text-brand-text">{row.original.title}</span>,
      },
      { accessorKey: 'videoTitle', header: 'الفيديو', cell: ({ row }) => <span className="text-brand-muted-strong">{row.original.videoTitle || '—'}</span> },
      { accessorKey: 'courseTitle', header: 'المقرر', cell: ({ row }) => <span className="text-brand-muted-strong">{row.original.courseTitle}</span> },
      {
        accessorKey: 'timeLimitSec',
        header: 'المدة',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{row.original.timeLimitSec ? `${Math.round(row.original.timeLimitSec / 60)} د` : '—'}</span>,
      },
      {
        accessorKey: 'passingScore',
        header: 'النجاح',
        cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{row.original.passingScore}%</span>,
      },
      { accessorKey: 'totalAttempts', header: 'محاولات', cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{row.original.totalAttempts}</span> },
      {
        accessorKey: 'pendingGrading',
        header: 'بانتظار التصحيح',
        cell: ({ row }) => (
          row.original.pendingGrading > 0 ? (
            <span className="rounded-full bg-brand-accent/10 px-2.5 py-1 text-xs font-bold text-brand-accent">
              {row.original.pendingGrading}
            </span>
          ) : (
            <span className="text-brand-muted">—</span>
          )
        ),
      },
      { accessorKey: 'updatedAt', header: 'آخر تحديث', cell: ({ row }) => <span className="whitespace-nowrap text-brand-muted">{formatDate(row.original.updatedAt)}</span> },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button type="button" title="طابور التصحيح" onClick={() => router.push(`/admin/quizzes/quiz/${row.original.slug}/attempts`)} className="rounded-full border border-brand-primary/25 p-2 text-brand-primary transition-colors duration-150 hover:bg-brand-primary hover:text-white">
              <ClipboardList className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="الوصول والاستثناءات" onClick={() => router.push(`/admin/quizzes/${row.original.videoSlug}/access`)} className="rounded-full border border-brand-secondary/40 p-2 text-brand-secondary transition-colors duration-150 hover:bg-brand-secondary hover:text-white">
              <Lock className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="إنشاء / تعديل" onClick={() => router.push(`/admin/quizzes/${row.original.videoSlug}`)} className="rounded-full border border-brand-border p-2 text-brand-muted-strong transition-colors duration-150 hover:bg-brand-hover hover:text-brand-primary">
              <FileQuestion className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="حذف" onClick={() => setDeleting(row.original)} className="rounded-full border border-brand-accent/30 p-2 text-brand-accent transition-colors duration-150 hover:bg-brand-accent hover:text-white">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [router],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1); };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteQuiz(deleting.slug);
      toast.success('تم حذف الاختبار.');
      setDeleting(null);
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر حذف الاختبار.');
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const rangeLabel = total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8 sm:py-8">
      <PageTitle title={adminTitle('الاختبارات')} />

      {/* Section header — eyebrow / heading / sub-copy, then the page action. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">التقييم والامتحانات</p>
          <h1 className="mt-1 text-xl font-extrabold text-brand-text">الاختبارات</h1>
          <p className="mt-1 text-sm text-brand-muted">جميع الاختبارات المرتبطة بالفيديوهات — {total} اختبار.</p>
        </div>
        <Button
          variant="outline"
          className="rounded-full border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
          onClick={() => void load()}
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Filter bar — the design's rounded-full search field + solid pill action. */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <Input
            dir="rtl"
            placeholder="ابحث باسم الاختبار أو الفيديو أو المقرر..."
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

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا توجد اختبارات مطابقة." variant="brand" />

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

      <ConfirmDialog
        open={deleting !== null}
        title="حذف الاختبار"
        description={`هل أنت متأكد من حذف "${deleting?.title}"؟ سيتم حذف جميع محاولات الطلاب المرتبطة به. لا يمكن التراجع عن هذه الخطوة.`}
        confirmLabel="حذف نهائيًا"
        busy={deleteBusy}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        onConfirm={() => void confirmDelete()}
        variant="brand"
      />
    </div>
  );
}