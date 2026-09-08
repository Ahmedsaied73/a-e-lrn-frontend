'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

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
import GradingForm from '@/components/admin/quiz/GradingForm';
import { getAdminAttemptResult, listAllAdminAttempts } from '@/services/adminQuizService';
import type { AdminGlobalAttempt } from '@/types/admin';
import type { AttemptStatus, QuizResultData } from '@/types/quiz';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { value: AttemptStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'كل الحالات' },
  { value: 'GRADING', label: 'بانتظار التصحيح' },
  { value: 'GRADED', label: 'مصححة' },
  { value: 'SUBMITTED', label: 'مُرسلة' },
  { value: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { value: 'EXPIRED', label: 'منتهية' },
];

const STATUS_BADGE: Record<AttemptStatus, string> = {
  IN_PROGRESS: 'border-sky-200 bg-sky-50 text-sky-700',
  SUBMITTED: 'border-outline-variant bg-slate-100 text-on-surface-variant',
  GRADING: 'border-amber-200 bg-amber-50 text-amber-700',
  GRADED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  EXPIRED: 'border-outline-variant bg-slate-100 text-on-surface-variant',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'تعذر تنفيذ العملية.';
}

export default function AdminGradingPage() {
  const [rows, setRows] = useState<AdminGlobalAttempt[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [status, setStatus] = useState<AttemptStatus | 'ALL'>('GRADING');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<QuizResultData | null>(null);
  const [resultAttempt, setResultAttempt] = useState<AdminGlobalAttempt | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAllAdminAttempts({
        page,
        limit: pageSize,
        status: status === 'ALL' ? '' : status,
        search: search || undefined,
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      if (page > res.meta.totalPages) setPage(Math.max(1, res.meta.totalPages));
    } catch {
      setError('تعذر تحميل المحاولات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1); };

  const openAttempt = async (attempt: AdminGlobalAttempt) => {
    setResultLoading(true);
    setError(null);
    try {
      const data = await getAdminAttemptResult(attempt.id);
      setResultAttempt(attempt);
      setResult(data);
    } catch (openError) {
      toast.error(errorMessage(openError));
    } finally {
      setResultLoading(false);
    }
  };

  const rangeLabel = total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">صندوق التصحيح</h1>
          <p className="mt-1 text-sm text-on-surface-variant">تصحيح المحاولات المقالية من جميع الاختبارات — {total} محاولة.</p>
        </div>
        <Button variant="outline" className="border-outline-variant text-on-surface-variant hover:border-[#207bff] hover:text-[#0057c0]" onClick={() => void load()}>
          <RefreshCw className="mr-0 h-4 w-4" />
          تحديث
        </Button>
      </div>

      <Card className="border-outline-variant/70 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-on-surface/80">بحث وعوامل تصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
              <Input
                dir="rtl"
                placeholder="ابحث باسم الطالب أو البريد أو الاختبار..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                className="border-outline-variant bg-white pr-9 text-on-surface placeholder:text-on-surface-variant/70 focus:border-emerald-500/70 focus:ring-2 focus:ring-[#207bff]/20"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v as AttemptStatus | 'ALL'); setPage(1); }}>
              <SelectTrigger className="w-44 border-outline-variant bg-white text-on-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-outline-variant bg-card text-on-surface">
                {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="bg-[#207bff] text-white hover:bg-[#0057c0]" onClick={applySearch}>
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-outline-variant/70 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-on-surface/80">قائمة المحاولات ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="py-6 text-center text-sm text-on-surface-variant">جارٍ التحميل...</p>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-on-surface-variant/70">لا توجد محاولات مطابقة.</p>
            ) : rows.map((attempt) => (
              <div key={attempt.id} className="rounded-xl border border-outline-variant/50 bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-on-surface">{attempt.student.name || attempt.student.email}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      {attempt.quizTitle} · {attempt.courseTitle}
                      {attempt.videoTitle ? ` · ${attempt.videoTitle}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant/70">
                      محاولة {attempt.attemptNumber} — {formatDate(attempt.startedAt)}
                    </p>
                  </div>
                  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', STATUS_BADGE[attempt.status])}>
                    {attempt.status}
                  </span>
                </div>
                {attempt.scorePercent != null && (
                  <p className="mt-2 text-sm text-on-surface-variant">
                    الدرجة: {attempt.scorePercent}% {attempt.passed ? <span className="text-emerald-600">· ناجح</span> : <span className="text-red-600">· راسب</span>}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void openAttempt(attempt)}
                  disabled={resultLoading}
                  className="mt-3 rounded-lg bg-[#207bff] px-3 py-2 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#0057c0] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  فتح الإجابات
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-outline-variant/70 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-on-surface/80">
              {resultAttempt ? `محاولة ${result?.attemptNumber} — ${resultAttempt.student.name || resultAttempt.student.email}` : 'التفاصيل'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!resultAttempt ? (
              <p className="py-6 text-center text-sm text-on-surface-variant/70">اختر محاولة لعرض نتيجتها وتصحيحها.</p>
            ) : result ? (
              <div className="space-y-5">
                {result.status === 'GRADING' ? (
                  <GradingForm
                    key={result.attemptId}
                    attempt={{ id: result.attemptId, attemptNumber: result.attemptNumber }}
                    result={result}
                    onGraded={async () => {
                      setResult(null);
                      setResultAttempt(null);
                      toast.success('تم اعتماد التصحيح.');
                      await load();
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-on-surface-variant">
                      الحالة: <span className="font-semibold text-on-surface">{result.status}</span>
                      {result.scorePercent != null && (
                        <> · الدرجة: <span className="font-semibold text-on-surface">{result.scorePercent}%</span></>
                      )}
                    </p>
                    <div className="space-y-2">
                      {result.questions.map((question) => (
                        <div key={question.name} className="rounded-xl border border-outline-variant/50 bg-surface p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-on-surface/80">{question.name}</p>
                            {'isCorrect' in question && (
                              <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', question.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700')}>
                                {question.isCorrect ? 'صحيحة' : 'خاطئة'}
                              </span>
                            )}
                            {'status' in question && question.status === 'GRADED' && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                {question.earnedPoints} / {question.maxPoints}
                              </span>
                            )}
                          </div>
                          {question.type === 'comment' && question.status === 'GRADED' && question.feedback && (
                            <p className="mt-1 text-xs text-on-surface-variant">ملاحظات: {question.feedback}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

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
          <Button variant="outline" className="border-outline-variant text-on-surface-variant hover:border-[#207bff] hover:text-[#0057c0]" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            السابق
          </Button>
          <span className="rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-sm text-on-surface-variant">
            صفحة {page} / {Math.max(1, totalPages)}
          </span>
          <Button variant="outline" className="border-outline-variant text-on-surface-variant hover:border-[#207bff] hover:text-[#0057c0]" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-outline-variant/70 bg-card p-3 text-sm text-on-surface-variant">
        <ClipboardList className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>هام: تصحيح مقالي — نسبة النجاح تحسب من مجموع درجات الاختبار. اعتماد تصحيح المقالي يجعل المحاولة نهائية.</span>
      </div>
    </div>
  );
}