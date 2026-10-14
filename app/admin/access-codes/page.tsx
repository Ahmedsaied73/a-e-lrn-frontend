'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Ticket,
  Plus,
  Download,
  Eye,
  Ban,
  Search,
  Copy,
  Check,
  User,
  Calendar,
  AlertCircle,
  Tag,
  RefreshCw,
  X,
  Layers,
  CheckCircle2,
} from 'lucide-react';

import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { accessCodeService, convertArabicDigits } from '@/services/accessCodeService';
import { getAdminCourses } from '@/services/adminCoursesService';
import { useAppSelector } from '@/store/hooks';
import { selectAuth, selectUser } from '@/store/slices/authSlice';
import type { AdminCourse } from '@/types/admin';
import type {
  AccessBatch,
  AccessCodeItem,
  CodeLookupResponse,
} from '@/types/accessCode';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

export default function AdminAccessCodesPage() {
  const user = useAppSelector(selectUser);
  const { initialized } = useAppSelector(selectAuth);
  const enabled = user?.features?.accessCodes !== false;

  // Batches state
  const [batches, setBatches] = useState<AccessBatch[]>([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const [summaryStats, setSummaryStats] = useState<{ available: number; redeemed: number; revoked: number } | null>(null);

  // Available courses for dropdowns
  const [courses, setCourses] = useState<AdminCourse[]>([]);

  // Batch Generation Dialog
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genCourseId, setGenCourseId] = useState<string>('');
  const [genQuantity, setGenQuantity] = useState<number>(100);
  const [genCodeLength, setGenCodeLength] = useState<8 | 10 | 12>(8);
  const [genLabel, setGenLabel] = useState('');
  const [genTags, setGenTags] = useState('');
  const [autoDownloadCsv, setAutoDownloadCsv] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Batch Revocation Confirm
  const [batchToRevoke, setBatchToRevoke] = useState<AccessBatch | null>(null);
  const [revokingBatch, setRevokingBatch] = useState(false);

  // Batch Details / Codes Viewer Modal
  const [viewingBatch, setViewingBatch] = useState<AccessBatch | null>(null);
  const [batchCodes, setBatchCodes] = useState<AccessCodeItem[]>([]);
  const [batchCodesTotal, setBatchCodesTotal] = useState(0);
  const [batchCodesTotalPages, setBatchCodesTotalPages] = useState(1);
  const [batchCodesPage, setBatchCodesPage] = useState(1);
  const [batchCodesStatusFilter, setBatchCodesStatusFilter] = useState<string>('ALL');
  const [batchCodesSearch, setBatchCodesSearch] = useState('');
  const [loadingBatchCodes, setLoadingBatchCodes] = useState(false);

  // Single Code Revocation inside viewer
  const [codeToRevoke, setCodeToRevoke] = useState<AccessCodeItem | null>(null);
  const [revokingCode, setRevokingCode] = useState(false);

  // Code Triage / Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<CodeLookupResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load courses once (only if enabled)
  useEffect(() => {
    if (!enabled) return;
    getAdminCourses({ limit: 100 })
      .then((res) => setCourses(res.data))
      .catch(() => toast.error('تعذر تحميل قائمة الدورات.'));
  }, [enabled]);

  // Load Batches
  const loadBatches = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await accessCodeService.getBatches({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        courseId: selectedCourseFilter === 'ALL' ? undefined : selectedCourseFilter,
      });
      setBatches(res.batches || []);
      setTotalBatches(res.pagination.total);
      setTotalPages(res.pagination.totalPages || 1);
      if (res.summaryStats) {
        setSummaryStats(res.summaryStats);
      }
    } catch {
      toast.error('تعذر تحميل دفعات الأكواد.');
    } finally {
      setLoading(false);
    }
  }, [enabled, page, pageSize, search, selectedCourseFilter]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  // Load codes for viewingBatch
  const loadBatchCodes = useCallback(async () => {
    if (!viewingBatch) return;
    setLoadingBatchCodes(true);
    try {
      const res = await accessCodeService.getBatchDetails(viewingBatch.id, {
        page: batchCodesPage,
        limit: 20,
        status: batchCodesStatusFilter === 'ALL' ? undefined : batchCodesStatusFilter,
        search: batchCodesSearch.trim() || undefined,
      });
      setBatchCodes(res.codes || []);
      setBatchCodesTotal(res.pagination.total);
      setBatchCodesTotalPages(res.pagination.totalPages || 1);
    } catch {
      toast.error('تعذر تحميل أكواد الدفعة.');
    } finally {
      setLoadingBatchCodes(false);
    }
  }, [viewingBatch, batchCodesPage, batchCodesStatusFilter, batchCodesSearch]);

  useEffect(() => {
    if (viewingBatch) {
      void loadBatchCodes();
    }
  }, [viewingBatch, loadBatchCodes]);

  // Handle batch generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genCourseId.trim()) {
      toast.error('يرجى اختيار الدورة التدريبية.');
      return;
    }
    if (!genQuantity || genQuantity < 1 || genQuantity > 10000) {
      toast.error('الكمية يجب أن تكون بين 1 و 10,000 كود.');
      return;
    }

    setGenerating(true);
    try {
      const tagsArray = genTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await accessCodeService.generateBatch({
        courseId: genCourseId.trim(),
        quantity: genQuantity,
        codeLength: genCodeLength,
        label: genLabel.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      });

      toast.success(`تم إنشاء الدفعة #${res.batchId} بنجاح بعدد ${res.quantity} كود!`);

      if (autoDownloadCsv) {
        try {
          const safeName = (res.courseName || 'codes').replace(/[/\\?%*:|"<>]/g, '_');
          await accessCodeService.triggerBatchCSVDownload(
            res.batchId,
            `batch-${res.batchId}-${safeName}.csv`,
          );
          toast.success('تم تحميل ملف الـ CSV تلقائياً.');
        } catch {
          toast.error('تم إنشاء الدفعة، ولكن تعذر تحميل ملف الـ CSV تلقائياً.');
        }
      }

      setGenerateOpen(false);
      setGenLabel('');
      setGenTags('');
      setGenQuantity(100);
      void loadBatches();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل إنشاء دفعة الأكواد.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle batch revocation
  const handleRevokeBatch = async () => {
    if (!batchToRevoke) return;
    setRevokingBatch(true);
    try {
      const res = await accessCodeService.revokeBatch(batchToRevoke.id);
      toast.success(`تم إلغاء ${res.revokedCount} كود غير مستخدم في الدفعة #${batchToRevoke.id}.`);
      setBatchToRevoke(null);
      void loadBatches();
      if (viewingBatch?.id === batchToRevoke.id) {
        void loadBatchCodes();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل إلغاء الدفعة.');
    } finally {
      setRevokingBatch(false);
    }
  };

  // Handle single code revocation
  const handleRevokeCode = async () => {
    if (!codeToRevoke) return;
    setRevokingCode(true);
    try {
      await accessCodeService.revokeCodes([codeToRevoke.id]);
      toast.success(`تم إلغاء الكود ${codeToRevoke.code} بنجاح.`);
      setCodeToRevoke(null);
      void loadBatchCodes();
      void loadBatches();
      if (lookupResult && lookupResult.id === codeToRevoke.id) {
        setLookupResult({ ...lookupResult, status: 'REVOKED' });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل إلغاء الكود.');
    } finally {
      setRevokingCode(false);
    }
  };

  // Handle code lookup / triage
  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = convertArabicDigits(lookupQuery).trim();
    if (!query) {
      toast.error('يرجى إدخال الكود المراد فحصه.');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await accessCodeService.lookupCode(query);
      setLookupResult(res);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'الكود غير موجود في النظام.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(text);
      toast.success('تم نسخ الكود للحافظة');
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Aggregated totals (server summaryStats across matching batches, or fallback to visible)
  const totalAvailable = summaryStats ? summaryStats.available : batches.reduce((acc, b) => acc + (b.stats?.available || 0), 0);
  const totalRedeemed = summaryStats ? summaryStats.redeemed : batches.reduce((acc, b) => acc + (b.stats?.redeemed || 0), 0);
  const totalRevoked = summaryStats ? summaryStats.revoked : batches.reduce((acc, b) => acc + (b.stats?.revoked || 0), 0);

  if (initialized && !enabled) {
    return (
      <>
        <PageTitle title={adminTitle('أكواد التفعيل')} />
        <main className="mx-auto max-w-7xl px-3 py-8 sm:px-8">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-12 text-center">
            <Ticket className="mx-auto h-12 w-12 text-brand-muted" />
            <h2 className="mt-4 text-lg font-bold text-brand-text">نظام أكواد التفعيل غير مفعّل</h2>
            <p className="mt-1 text-sm text-brand-muted">
              تم تعطيل ميزة كروت وأكواد السناتر من إعدادات المنصة.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageTitle title={adminTitle('أكواد التفعيل')} />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Ticket className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold sm:text-2xl text-brand-text">أكواد التفعيل (Access Codes)</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-brand-muted">
                توليد دفعات كروت السناتر، تصدير CSV، ومتابعة تفعيل الطلاب وإلغاء الأكواد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (courses.length > 0 && !genCourseId) {
                setGenCourseId(courses[0].slug);
              }
              setGenerateOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <Plus className="h-4 w-4" />
            إنشاء دفعة جديدة
          </button>
        </div>

        {/* Overview Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-muted">إجمالي الدفعات</span>
              <Layers className="h-4 w-4 text-brand-primary" />
            </div>
            <p className="mt-2 text-2xl font-black text-brand-text tabular-nums">{totalBatches}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600">الأكواد المتاحة</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600 tabular-nums">{totalAvailable}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-muted-strong">الأكواد المستخدمة</span>
              <User className="h-4 w-4 text-brand-secondary" />
            </div>
            <p className="mt-2 text-2xl font-black text-brand-secondary tabular-nums">{totalRedeemed}</p>
          </div>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-500">الأكواد الملغاة</span>
              <Ban className="h-4 w-4 text-red-400" />
            </div>
            <p className="mt-2 text-2xl font-black text-red-500 tabular-nums">{totalRevoked}</p>
          </div>
        </div>

        {/* Code Triage / Search Bar */}
        <div className="mt-6 rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-brand-primary" />
              <h2 className="text-sm font-bold text-brand-text">فحص وتتبع كود سنتر</h2>
            </div>
            {lookupResult && (
              <button
                type="button"
                onClick={() => {
                  setLookupResult(null);
                  setLookupQuery('');
                }}
                className="text-xs text-brand-muted hover:text-brand-text transition"
              >
                مسح نتيجة الفحص
              </button>
            )}
          </div>

          <form onSubmit={handleLookup} className="mt-3 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <input
                value={lookupQuery}
                onChange={(e) => setLookupQuery(convertArabicDigits(e.target.value).toUpperCase())}
                placeholder="أدخل كود الكارت هنا (مثال: A7X3-K9M2)..."
                className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm font-mono tracking-wider text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary"
              />
              {lookupQuery && (
                <button
                  type="button"
                  onClick={() => setLookupQuery('')}
                  className="absolute end-3 top-3 text-brand-muted hover:text-brand-text"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={lookupLoading}
              className="rounded-xl bg-brand-primary px-6 text-sm font-bold text-white hover:bg-brand-primary/90"
            >
              {lookupLoading ? 'جارٍ الفحص...' : 'فحص الكود'}
            </Button>
          </form>

          {/* Lookup Error */}
          {lookupError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* Lookup Result Card */}
          {lookupResult && (
            <div className="mt-4 rounded-xl border border-brand-border bg-brand-bg/60 p-4 transition">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base sm:text-lg font-black tracking-widest text-brand-text">
                    {lookupResult.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(lookupResult.code)}
                    title="نسخ الكود"
                    className="grid h-7 w-7 place-items-center rounded-md border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-primary"
                  >
                    {copiedCode === lookupResult.code ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <StatusBadge status={lookupResult.status} />
                </div>
                {lookupResult.status === 'AVAILABLE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCodeToRevoke({
                        id: lookupResult.id,
                        code: lookupResult.code,
                        status: lookupResult.status,
                      });
                    }}
                    className="rounded-full border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    إلغاء هذا الكود
                  </Button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block text-brand-muted">اسم الدورة:</span>
                  <span className="mt-0.5 block font-bold text-brand-text">{lookupResult.courseName}</span>
                </div>
                <div>
                  <span className="block text-brand-muted">الدفعة / السنتر:</span>
                  <span className="mt-0.5 block font-bold text-brand-text">
                    #{lookupResult.batchId} {lookupResult.batchLabel ? `(${lookupResult.batchLabel})` : ''}
                  </span>
                </div>
                <div>
                  <span className="block text-brand-muted">تاريخ الإنشاء:</span>
                  <span className="mt-0.5 block font-medium text-brand-text">{formatDate(lookupResult.createdAt)}</span>
                </div>
              </div>

              {lookupResult.status === 'REDEEMED' && lookupResult.redeemedBy && (
                <div className="mt-3 rounded-lg border border-brand-border bg-brand-surface p-3 text-xs">
                  <span className="font-bold text-brand-primary">بيانات التفعيل للطالب:</span>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-brand-text">
                    <span>الاسم: <strong>{lookupResult.redeemedBy.name}</strong></span>
                    {lookupResult.redeemedBy.email && (
                      <span dir="ltr" className="text-brand-muted font-mono">{lookupResult.redeemedBy.email}</span>
                    )}
                    <span>تاريخ التفعيل: <strong>{formatDate(lookupResult.redeemedAt)}</strong></span>
                  </div>
                </div>
              )}

              {lookupResult.status === 'REVOKED' && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs text-red-700">
                  <span className="font-bold">تم إلغاء هذا الكود:</span>
                  <span className="ms-2">تاريخ الإلغاء: {formatDate(lookupResult.revokedAt)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Batches Table Header & Filters */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-brand-text">دفعات الأكواد المولدة</h2>
            <p className="text-xs text-brand-muted">{totalBatches} دفعة مسجلة في النظام</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="بحث بالدفعة، الكورس، أو السنتر…"
                className="w-56 sm:w-64 rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-xs text-brand-text outline-none transition focus:border-brand-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute end-3 top-2.5 text-brand-muted hover:text-brand-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select
              value={selectedCourseFilter}
              onValueChange={(val) => {
                setSelectedCourseFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40 rounded-full border-brand-border bg-brand-surface text-xs text-brand-text">
                <SelectValue placeholder="فلترة بالدورة" />
              </SelectTrigger>
              <SelectContent className="bg-brand-surface border-brand-border">
                <SelectItem value="ALL">كل الدورات</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={() => void loadBatches()}
              title="تحديث"
              className="grid h-9 w-9 place-items-center rounded-full border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-primary transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Batches Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-end text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg/50 text-brand-muted">
                  <th className="px-4 py-3 text-start">الدفعة</th>
                  <th className="px-4 py-3 text-start">الدورة</th>
                  <th className="px-4 py-3 text-start">البيان / السنتر</th>
                  <th className="px-4 py-3 text-center">الكمية</th>
                  <th className="px-4 py-3 text-center">حالة الأكواد</th>
                  <th className="px-4 py-3 text-center">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skel-${i}`}>
                      <td colSpan={7} className="px-4 py-4 text-center">
                        <div className="h-4 w-full animate-pulse rounded bg-brand-chip" />
                      </td>
                    </tr>
                  ))
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-brand-muted">
                      لا توجد دفعات أكواد مطابقة لبحثك.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => {
                    const available = batch.stats?.available || 0;
                    const redeemed = batch.stats?.redeemed || 0;
                    const revoked = batch.stats?.revoked || 0;
                    const total = batch.quantity;
                    const redeemedPct = total > 0 ? Math.round((redeemed / total) * 100) : 0;

                    return (
                      <tr key={batch.id} className="transition hover:bg-brand-hover/40">
                        {/* Batch ID & Length */}
                        <td className="px-4 py-3.5 text-start">
                          <span className="font-bold text-brand-primary">#{batch.id}</span>
                          <span className="ms-1.5 rounded bg-brand-chip px-1.5 py-0.5 text-[10px] text-brand-muted">
                            {batch.codeLength} خانات
                          </span>
                        </td>

                        {/* Course Name */}
                        <td className="px-4 py-3.5 text-start font-semibold text-brand-text">
                          {batch.courseName}
                        </td>

                        {/* Label & Tags */}
                        <td className="px-4 py-3.5 text-start">
                          <p className="font-medium text-brand-text">{batch.label || '—'}</p>
                          {batch.tags && batch.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {batch.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-0.5 rounded-full bg-brand-chip px-2 py-0.5 text-[10px] text-brand-muted"
                                >
                                  <Tag className="h-2.5 w-2.5" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="px-4 py-3.5 text-center font-bold text-brand-text tabular-nums">
                          {batch.quantity.toLocaleString('ar-EG')}
                        </td>

                        {/* Code States & Mini Progress */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700" title="متاح">
                              {available} متاح
                            </span>
                            <span className="rounded-full bg-brand-chip px-2 py-0.5 text-[10px] font-bold text-brand-secondary" title="مُستخدم">
                              {redeemed} مستخدم
                            </span>
                            {revoked > 0 && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600" title="ملغي">
                                {revoked} ملغي
                              </span>
                            )}
                          </div>
                          <div className="mx-auto mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-brand-chip">
                            <div
                              className="h-full bg-brand-secondary transition-all"
                              style={{ width: `${redeemedPct}%` }}
                              title={`نسبة الاستهلاك: ${redeemedPct}%`}
                            />
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-center text-xs text-brand-muted whitespace-nowrap">
                          {formatDate(batch.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* View Codes */}
                            <button
                              type="button"
                              onClick={() => {
                                setViewingBatch(batch);
                                setBatchCodesPage(1);
                                setBatchCodesStatusFilter('ALL');
                                setBatchCodesSearch('');
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-text transition hover:bg-brand-hover hover:text-brand-primary"
                              title="عرض وفحص أكواد الدفعة"
                            >
                              <Eye className="h-3.5 w-3.5 text-brand-primary" />
                              عرض
                            </button>

                            {/* Download CSV */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  toast.loading('جارٍ تجهيز ملف CSV...', { id: 'csv-dl' });
                                  const safeName = (batch.courseName || 'codes').replace(/[/\\?%*:|"<>]/g, '_');
                                  await accessCodeService.triggerBatchCSVDownload(
                                    batch.id,
                                    `batch-${batch.id}-${safeName}.csv`,
                                  );
                                  toast.success('تم تحميل ملف الـ CSV بنجاح!', { id: 'csv-dl' });
                                } catch {
                                  toast.error('فشل تحميل ملف CSV.', { id: 'csv-dl' });
                                }
                              }}
                              className="grid h-7 w-7 place-items-center rounded-lg border border-brand-border bg-brand-surface text-brand-muted transition hover:bg-brand-hover hover:text-emerald-600"
                              title="تحميل ملف CSV"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>

                            {/* Revoke Batch (if has available codes) */}
                            {available > 0 && (
                              <button
                                type="button"
                                onClick={() => setBatchToRevoke(batch)}
                                className="grid h-7 w-7 place-items-center rounded-lg border border-brand-border bg-brand-surface text-brand-muted transition hover:bg-red-50 hover:text-red-600"
                                title="إلغاء جميع الأكواد المتبقية بالدفعة"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Batches Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-brand-border px-4 py-3 text-xs text-brand-muted">
              <div>
                صفحة <strong>{page}</strong> من <strong>{totalPages}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border-brand-border text-xs"
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border-brand-border text-xs"
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal 1: Generate Batch Dialog ── */}
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogContent className="max-w-lg rounded-2xl border-brand-border bg-brand-surface text-brand-text">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-brand-text">
                <Ticket className="h-5 w-5 text-brand-primary" />
                إنشاء دفعة أكواد تفعيل جديدة
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleGenerate} className="mt-4 space-y-4">
              {/* Course Select */}
              <div>
                <Label className="text-xs font-semibold text-brand-muted-strong">الدورة التدريبية *</Label>
                <Select value={genCourseId} onValueChange={setGenCourseId}>
                  <SelectTrigger className="mt-1.5 w-full rounded-xl border-brand-border bg-brand-bg text-sm text-brand-text">
                    <SelectValue placeholder="اختر الدورة..." />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface border-brand-border max-h-60">
                    {courses.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity & Code Length */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-brand-muted-strong">عدد الأكواد (الكمية) *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10000}
                    value={genQuantity}
                    onChange={(e) => setGenQuantity(parseInt(e.target.value, 10) || 1)}
                    className="mt-1.5 rounded-xl border-brand-border bg-brand-bg text-sm text-brand-text"
                    required
                  />
                  <span className="mt-0.5 block text-[11px] text-brand-muted">من 1 إلى 10,000 كود</span>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-brand-muted-strong">طول الكود *</Label>
                  <Select
                    value={String(genCodeLength)}
                    onValueChange={(val) => setGenCodeLength(Number(val) as 8 | 10 | 12)}
                  >
                    <SelectTrigger className="mt-1.5 w-full rounded-xl border-brand-border bg-brand-bg text-sm text-brand-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-surface border-brand-border">
                      <SelectItem value="8">8 خانات (افتراضي - موصى به)</SelectItem>
                      <SelectItem value="10">10 خانات</SelectItem>
                      <SelectItem value="12">12 خانة</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="mt-0.5 block text-[11px] text-brand-muted">أبجدية سهلة القراءة بدون التباس</span>
                </div>
              </div>

              {/* Label / Center Name */}
              <div>
                <Label className="text-xs font-semibold text-brand-muted-strong">بيان الدفعة / اسم السنتر</Label>
                <Input
                  value={genLabel}
                  onChange={(e) => setGenLabel(e.target.value)}
                  placeholder="مثال: سنتر الأقصى - الدفعة الأولى"
                  className="mt-1.5 rounded-xl border-brand-border bg-brand-bg text-sm text-brand-text"
                />
              </div>

              {/* Tags */}
              <div>
                <Label className="text-xs font-semibold text-brand-muted-strong">الوسوم (مفصولة بفاصلة)</Label>
                <Input
                  value={genTags}
                  onChange={(e) => setGenTags(e.target.value)}
                  placeholder="أكتوبر, سنتر الأقصى, كروت ورقية"
                  className="mt-1.5 rounded-xl border-brand-border bg-brand-bg text-sm text-brand-text"
                />
              </div>

              {/* Auto Download CSV checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoCsv"
                  checked={autoDownloadCsv}
                  onChange={(e) => setAutoDownloadCsv(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-border text-brand-primary accent-brand-primary"
                />
                <label htmlFor="autoCsv" className="text-xs text-brand-muted-strong cursor-pointer">
                  تحميل ملف CSV تلقائياً فور توليد الأكواد للطباعة المباشرة
                </label>
              </div>

              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGenerateOpen(false)}
                  disabled={generating}
                  className="rounded-full border-brand-border text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={generating}
                  className="rounded-full bg-brand-primary px-6 text-xs font-bold text-white hover:bg-brand-primary/90"
                >
                  {generating ? 'جارٍ توليد الأكواد...' : 'توليد الدفعة الآن'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Modal 2: Batch Codes Viewer Modal ── */}
        <Dialog open={!!viewingBatch} onOpenChange={(open) => !open && setViewingBatch(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-brand-border bg-brand-surface text-brand-text p-6">
            <DialogHeader className="border-b border-brand-border pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-brand-primary" />
                  <div>
                    <DialogTitle className="text-base font-bold text-brand-text">
                      أكواد الدفعة #{viewingBatch?.id} — {viewingBatch?.courseName}
                    </DialogTitle>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {viewingBatch?.label ? `${viewingBatch.label} • ` : ''}
                      إجمالي {viewingBatch?.quantity} كود
                    </p>
                  </div>
                </div>

                {viewingBatch && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        toast.loading('جارٍ تحميل ملف CSV...', { id: 'csv-view' });
                        const safeName = (viewingBatch.courseName || 'codes').replace(/[/\\?%*:|"<>]/g, '_');
                        await accessCodeService.triggerBatchCSVDownload(
                          viewingBatch.id,
                          `batch-${viewingBatch.id}-${safeName}.csv`,
                        );
                        toast.success('تم تحميل الملف بنجاح!', { id: 'csv-view' });
                      } catch {
                        toast.error('تعذر تحميل ملف CSV.', { id: 'csv-view' });
                      }
                    }}
                    className="rounded-full border-brand-border text-xs"
                  >
                    <Download className="h-3.5 w-3.5 me-1.5" />
                    تحميل CSV
                  </Button>
                )}
              </div>
            </DialogHeader>

            {/* Batch Codes Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  value={batchCodesSearch}
                  onChange={(e) => {
                    setBatchCodesSearch(convertArabicDigits(e.target.value).toUpperCase());
                    setBatchCodesPage(1);
                  }}
                  placeholder="بحث عن كود في هذه الدفعة..."
                  className="w-full rounded-full border border-brand-border bg-brand-bg px-4 py-1.5 text-xs font-mono text-brand-text outline-none focus:border-brand-primary"
                />
                {batchCodesSearch && (
                  <button
                    type="button"
                    onClick={() => setBatchCodesSearch('')}
                    className="absolute end-3 top-2 text-brand-muted hover:text-brand-text"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={batchCodesStatusFilter}
                onValueChange={(val) => {
                  setBatchCodesStatusFilter(val);
                  setBatchCodesPage(1);
                }}
              >
                <SelectTrigger className="w-32 rounded-full border-brand-border bg-brand-bg text-xs">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface border-brand-border">
                  <SelectItem value="ALL">كل الحالات</SelectItem>
                  <SelectItem value="AVAILABLE">المتاح</SelectItem>
                  <SelectItem value="REDEEMED">المُستخدم</SelectItem>
                  <SelectItem value="REVOKED">الملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Codes List Table */}
            <div className="mt-4 overflow-hidden rounded-xl border border-brand-border">
              <table className="w-full text-end text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-bg/50 text-brand-muted">
                    <th className="px-3 py-2.5 text-start">الكود</th>
                    <th className="px-3 py-2.5 text-center">الحالة</th>
                    <th className="px-3 py-2.5 text-start">الطالب المستخدم</th>
                    <th className="px-3 py-2.5 text-center">تاريخ التفعيل / الإلغاء</th>
                    <th className="px-3 py-2.5 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {loadingBatchCodes ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skc-${i}`}>
                        <td colSpan={5} className="px-3 py-3 text-center">
                          <div className="h-3 w-full animate-pulse rounded bg-brand-chip" />
                        </td>
                      </tr>
                    ))
                  ) : batchCodes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-brand-muted">
                        لا توجد أكواد مطابقة.
                      </td>
                    </tr>
                  ) : (
                    batchCodes.map((item) => (
                      <tr key={item.id} className="transition hover:bg-brand-hover/30">
                        {/* Code String + Copy */}
                        <td className="px-3 py-2 text-start font-mono font-bold tracking-wider text-brand-text">
                          <div className="inline-flex items-center gap-1.5">
                            <span>{item.code}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.code)}
                              title="نسخ الكود"
                              className="text-brand-muted hover:text-brand-primary"
                            >
                              {copiedCode === item.code ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2 text-center">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Redeemed By */}
                        <td className="px-3 py-2 text-start">
                          {item.redeemedBy ? (
                            <div>
                              <p className="font-semibold text-brand-text">{item.redeemedBy.name}</p>
                              {item.redeemedBy.email && (
                                <p className="text-[10px] text-brand-muted font-mono" dir="ltr">
                                  {item.redeemedBy.email}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-brand-muted">—</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-3 py-2 text-center text-[11px] text-brand-muted whitespace-nowrap">
                          {item.redeemedAt
                            ? formatDate(item.redeemedAt)
                            : item.revokedAt
                              ? `ملغي: ${formatDate(item.revokedAt)}`
                              : '—'}
                        </td>

                        {/* Action */}
                        <td className="px-3 py-2 text-center">
                          {item.status === 'AVAILABLE' ? (
                            <button
                              type="button"
                              onClick={() => setCodeToRevoke(item)}
                              className="rounded px-2 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                            >
                              إلغاء الكود
                            </button>
                          ) : (
                            <span className="text-brand-muted text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Batch Codes Pagination */}
            {batchCodesTotalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-brand-muted">
                <span>
                  إجمالي {batchCodesTotal} كود (صفحة {batchCodesPage} من {batchCodesTotalPages})
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchCodesPage <= 1}
                    onClick={() => setBatchCodesPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs rounded-lg border-brand-border"
                  >
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchCodesPage >= batchCodesTotalPages}
                    onClick={() => setBatchCodesPage((p) => Math.min(batchCodesTotalPages, p + 1))}
                    className="h-7 text-xs rounded-lg border-brand-border"
                  >
                    التالي
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Confirm Dialog: Revoke Batch ── */}
        <ConfirmDialog
          open={!!batchToRevoke}
          onOpenChange={(open) => !open && setBatchToRevoke(null)}
          title={`إلغاء أكواد الدفعة #${batchToRevoke?.id}`}
          description={`هل أنت متأكد من رغبتك في إلغاء كافة الأكواد المتبقية (${batchToRevoke?.stats?.available || 0} كود غير مستخدم) في الدفعة الخاصة بدورة "${batchToRevoke?.courseName}"؟ لن يتمكن أي طالب من تفعيل هذه الأكواد لاحقاً.`}
          confirmLabel="تأكيد إلغاء الدفعة"
          busy={revokingBatch}
          onConfirm={handleRevokeBatch}
          variant="brand"
        />

        {/* ── Confirm Dialog: Revoke Single Code ── */}
        <ConfirmDialog
          open={!!codeToRevoke}
          onOpenChange={(open) => !open && setCodeToRevoke(null)}
          title={`إلغاء الكود ${codeToRevoke?.code}`}
          description="هل أنت متأكد من إلغاء هذا الكود بشكل فوري؟ لن يعود صالحاً للاستخدام من قِبل أي طالب."
          confirmLabel="تأكيد الإلغاء"
          busy={revokingCode}
          onConfirm={handleRevokeCode}
          variant="brand"
        />
      </main>
    </>
  );
}
