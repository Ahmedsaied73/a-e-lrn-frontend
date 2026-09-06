'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCoreRowModel, type ColumnDef, useReactTable } from '@tanstack/react-table';
import { ClipboardList, FileQuestion, Lock, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { DataTable } from '@/components/admin/DataTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      { accessorKey: 'id', header: 'الرقم', size: 70 },
      {
        accessorKey: 'title',
        header: 'الاختبار',
        cell: ({ row }) => <span className="font-semibold text-slate-100">{row.original.title}</span>,
      },
      { accessorKey: 'videoTitle', header: 'الفيديو', cell: ({ row }) => <span className="text-slate-300">{row.original.videoTitle || '—'}</span> },
      { accessorKey: 'courseTitle', header: 'المقرر', cell: ({ row }) => <span className="text-slate-300">{row.original.courseTitle}</span> },
      {
        accessorKey: 'timeLimitSec',
        header: 'المدة',
        cell: ({ row }) => <span className="text-slate-300">{row.original.timeLimitSec ? `${Math.round(row.original.timeLimitSec / 60)} د` : '—'}</span>,
      },
      {
        accessorKey: 'passingScore',
        header: 'النجاح',
        cell: ({ row }) => <span className="text-slate-300">{row.original.passingScore}%</span>,
      },
      { accessorKey: 'totalAttempts', header: 'محاولات', cell: ({ row }) => <span className="text-slate-300">{row.original.totalAttempts}</span> },
      {
        accessorKey: 'pendingGrading',
        header: 'بانتظار التصحيح',
        cell: ({ row }) => (
          row.original.pendingGrading > 0 ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
              {row.original.pendingGrading}
            </span>
          ) : (
            <span className="text-slate-500">—</span>
          )
        ),
      },
      { accessorKey: 'updatedAt', header: 'آخر تحديث', cell: ({ row }) => <span className="text-slate-400">{formatDate(row.original.updatedAt)}</span> },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button type="button" title="طابور التصحيح" onClick={() => router.push(`/admin/quizzes/quiz/${row.original.id}/attempts`)} className="rounded-lg border border-emerald-500/40 p-2 text-emerald-300 transition-colors duration-150 hover:border-emerald-400 hover:text-emerald-200">
              <ClipboardList className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="الوصول والاستثناءات" onClick={() => router.push(`/admin/quizzes/${row.original.videoId}/access`)} className="rounded-lg border border-sky-500/40 p-2 text-sky-300 transition-colors duration-150 hover:border-sky-400 hover:text-sky-200">
              <Lock className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="إنشاء / تعديل" onClick={() => router.push(`/admin/quizzes/${row.original.videoId}`)} className="rounded-lg border border-slate-600 p-2 text-slate-300 transition-colors duration-150 hover:border-slate-400 hover:text-slate-100">
              <FileQuestion className="h-3.5 w-3.5" />
            </button>
            <button type="button" title="حذف" onClick={() => setDeleting(row.original)} className="rounded-lg border border-red-500/40 p-2 text-red-300 transition-colors duration-150 hover:border-red-400 hover:text-red-200">
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

  const applySearch = () => setSearch(searchInput.trim());

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteQuiz(deleting.id);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">الاختبارات</h1>
          <p className="mt-1 text-sm text-slate-400">جميع الاختبارات المرتبطة بالفيديوهات — {total} اختبار.</p>
        </div>
        <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => void load()}>
          <RefreshCw className="mr-0 h-4 w-4" />
          تحديث
        </Button>
      </div>

      <Card className="border-slate-700/60 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-200">بحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-0 flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  dir="rtl"
                  placeholder="ابحث باسم الاختبار أو الفيديو أو المقرر..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                  className="border-slate-700 bg-slate-900/50 pr-9 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>
            </div>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={applySearch}>
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{error}</p>}

      <DataTable table={table} columns={columns} loading={loading} emptyLabel="لا توجد اختبارات مطابقة." />

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

      <ConfirmDialog
        open={deleting !== null}
        title="حذف الاختبار"
        description={`هل أنت متأكد من حذف "${deleting?.title}"؟ سيتم حذف جميع محاولات الطلاب المرتبطة به. لا يمكن التراجع عن هذه الخطوة.`}
        confirmLabel="حذف نهائيًا"
        busy={deleteBusy}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}