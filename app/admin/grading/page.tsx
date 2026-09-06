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
  IN_PROGRESS: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  SUBMITTED: 'border-slate-600 bg-slate-700/40 text-slate-300',
  GRADING: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  GRADED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  EXPIRED: 'border-slate-600 bg-slate-700/40 text-slate-400',
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
    } catch {
      setError('تعذر تحميل المحاولات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const applySearch = () => setSearch(searchInput.trim());

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
          <h1 className="text-2xl font-bold text-slate-100">صندوق التصحيح</h1>
          <p className="mt-1 text-sm text-slate-400">تصحيح المحاولات المقالية من جميع الاختبارات — {total} محاولة.</p>
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
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                dir="rtl"
                placeholder="ابحث باسم الطالب أو البريد أو الاختبار..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                className="border-slate-700 bg-slate-900/50 pr-9 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v as AttemptStatus | 'ALL'); setPage(1); }}>
              <SelectTrigger className="w-44 border-slate-700 bg-slate-900/50 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-card text-slate-100">
                {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={applySearch}>
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-slate-700/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-200">قائمة المحاولات ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-400">جارٍ التحميل...</p>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">لا توجد محاولات مطابقة.</p>
            ) : rows.map((attempt) => (
              <div key={attempt.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-100">{attempt.student.name || attempt.student.email}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {attempt.quizTitle} · {attempt.courseTitle}
                      {attempt.videoTitle ? ` · ${attempt.videoTitle}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      محاولة {attempt.attemptNumber} — {formatDate(attempt.startedAt)}
                    </p>
                  </div>
                  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', STATUS_BADGE[attempt.status])}>
                    {attempt.status}
                  </span>
                </div>
                {attempt.scorePercent != null && (
                  <p className="mt-2 text-sm text-slate-300">
                    الدرجة: {attempt.scorePercent}% {attempt.passed ? <span className="text-emerald-400">· ناجح</span> : <span className="text-red-400">· راسب</span>}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void openAttempt(attempt)}
                  disabled={resultLoading}
                  className="mt-3 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 transition-colors duration-150 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  فتح الإجابات
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-700/60 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-200">
              {resultAttempt ? `محاولة ${result?.attemptNumber} — ${resultAttempt.student.name || resultAttempt.student.email}` : 'التفاصيل'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!resultAttempt ? (
              <p className="py-6 text-center text-sm text-slate-500">اختر محاولة لعرض نتيجتها وتصحيحها.</p>
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
                    <p className="text-sm text-slate-300">
                      الحالة: <span className="font-semibold text-slate-100">{result.status}</span>
                      {result.scorePercent != null && (
                        <> · الدرجة: <span className="font-semibold text-slate-100">{result.scorePercent}%</span></>
                      )}
                    </p>
                    <div className="space-y-2">
                      {result.questions.map((question) => (
                        <div key={question.name} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-200">{question.name}</p>
                            {'isCorrect' in question && (
                              <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', question.isCorrect ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-red-500/40 bg-red-500/10 text-red-300')}>
                                {question.isCorrect ? 'صحيحة' : 'خاطئة'}
                              </span>
                            )}
                            {'status' in question && question.status === 'GRADED' && (
                              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                                {question.earnedPoints} / {question.maxPoints}
                              </span>
                            )}
                          </div>
                          {question.type === 'comment' && question.status === 'GRADED' && question.feedback && (
                            <p className="mt-1 text-xs text-slate-400">ملاحظات: {question.feedback}</p>
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

      <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-card p-3 text-sm text-slate-400">
        <ClipboardList className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>هام: تصحيح مقالي — نسبة النجاح تحسب من مجموع درجات الاختبار. اعتماد تصحيح المقالي يجعل المحاولة نهائية.</span>
      </div>
    </div>
  );
}