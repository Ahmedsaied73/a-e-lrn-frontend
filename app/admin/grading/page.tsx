'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

const STATUS_OPTIONS: { value: AttemptStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'كل الحالات' },
  { value: 'GRADING', label: 'بانتظار التصحيح' },
  { value: 'GRADED', label: 'مصححة' },
  { value: 'SUBMITTED', label: 'مُرسلة' },
  { value: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { value: 'EXPIRED', label: 'منتهية' },
];

const STATUS_BADGE: Record<AttemptStatus, string> = {
  IN_PROGRESS: 'border-brand-primary/25 bg-brand-primary/10 text-brand-primary',
  SUBMITTED: 'border-brand-border bg-brand-chip text-brand-muted-strong',
  GRADING: 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent',
  GRADED: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  EXPIRED: 'border-brand-border bg-brand-chip text-brand-muted-strong',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'تعذر تنفيذ العملية.';
}

function AttemptDetailBody({
  result,
  resultAttempt,
  onGraded,
}: {
  result: QuizResultData | null;
  resultAttempt: AdminGlobalAttempt | null;
  onGraded: () => Promise<void>;
}) {
  if (!resultAttempt) {
    return <p className="py-10 text-center text-sm text-brand-muted">اختر محاولة لعرض نتيجتها وتصحيحها.</p>;
  }
  if (!result) return null;
  if (result.status === 'GRADING') {
    return (
      <GradingForm
        key={result.attemptId}
        attempt={{ id: result.attemptId, attemptNumber: result.attemptNumber }}
        result={result}
        onGraded={onGraded}
      />
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-brand-muted">
        الحالة: <span className="font-bold text-brand-text">{result.status}</span>
        {result.scorePercent != null && (
          <> · الدرجة: <span className="font-bold text-brand-text">{result.scorePercent}%</span></>
        )}
      </p>
      <div className="space-y-2.5">
        {result.questions.map((question) => (
          <div key={question.name} className="rounded-xl border border-brand-border bg-brand-bg p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-brand-text">{question.name}</p>
              {'isCorrect' in question && (
                <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-bold', question.isCorrect ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent')}>
                  {question.isCorrect ? 'صحيحة' : 'خاطئة'}
                </span>
              )}
              {'status' in question && question.status === 'GRADED' && (
                <span className="rounded-full border border-brand-primary/25 bg-brand-primary/10 px-2 py-0.5 text-[11px] font-bold text-brand-primary">
                  {question.earnedPoints} / {question.maxPoints}
                </span>
              )}
            </div>
            {question.type === 'comment' && question.status === 'GRADED' && question.feedback && (
              <p className="mt-1.5 text-xs leading-relaxed text-brand-muted-strong">ملاحظات: {question.feedback}</p>
            )}
            {/* gradedBy/confidence come from the backend result — real data, never invented. */}
            {'gradedBy' in question && question.gradedBy === 'ai' && (
              <p className="mt-2 rounded-lg border-s-2 border-s-brand-secondary bg-brand-secondary/5 px-3 py-1.5 text-[11px] font-semibold text-brand-muted-strong">
                🤖 تصحيح تلقائي — راجع الدرجة قبل الاعتماد{typeof question.confidence === 'number' ? ` (الثقة ${Math.round(question.confidence * 100)}%)` : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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

  const mobileDetailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (resultAttempt && typeof window !== 'undefined' && window.innerWidth < 1024) {
      mobileDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [resultAttempt]);

  const handleGraded = useCallback(async () => {
    setResult(null);
    setResultAttempt(null);
    toast.success('تم اعتماد التصحيح.');
    await load();
  }, [load]);

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
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8 sm:py-8">
      <PageTitle title={adminTitle('تصحيح المقالي')} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">التقييم والامتحانات</p>
          <h1 className="mt-1 text-xl font-extrabold text-brand-text">صندوق التصحيح</h1>
          <p className="mt-1 text-sm text-brand-muted">تصحيح المحاولات المقالية من جميع الاختبارات — {total} محاولة.</p>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-full border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text"
          onClick={() => void load()}
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      <Card className="rounded-2xl border-brand-border bg-brand-surface shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-brand-text">بحث وعوامل تصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <Input
                dir="rtl"
                placeholder="ابحث باسم الطالب أو البريد أو الاختبار..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                className="rounded-full border-brand-border bg-brand-surface pe-10 text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus-visible:ring-brand-primary/30"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v as AttemptStatus | 'ALL'); setPage(1); }}>
              <SelectTrigger className="h-10 w-44 rounded-full border-brand-border bg-brand-surface text-sm font-semibold text-brand-muted-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-border bg-brand-surface text-brand-text">
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="rounded-lg text-brand-text focus:bg-brand-hover focus:text-brand-text">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="rounded-full bg-brand-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
              onClick={applySearch}
            >
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm font-semibold text-brand-accent">
          {error}
        </p>
      )}

      {/* The design's grading frame: a narrow attempts rail beside a wide detail pane. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <Card className="rounded-2xl border-brand-border bg-brand-surface shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-brand-text">قائمة المحاولات ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {loading ? (
              <p className="py-6 text-center text-sm text-brand-muted">جارٍ التحميل...</p>
            ) : rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-brand-muted">لا توجد محاولات مطابقة.</p>
            ) : rows.map((attempt) => {
              const active = resultAttempt?.id === attempt.id;
              return (
                <div
                  key={attempt.id}
                  className={cn(
                    'rounded-xl border-s-2 px-4 py-3 transition-colors duration-150',
                    active
                      ? 'border-s-brand-primary bg-brand-primary/5'
                      : 'border-s-transparent bg-brand-chip/50 hover:bg-brand-hover',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-brand-text">{attempt.student.name || attempt.student.email}</p>
                      <p className="mt-0.5 truncate text-xs text-brand-muted">
                        {attempt.quizTitle} · {attempt.courseTitle}
                        {attempt.videoTitle ? ` · ${attempt.videoTitle}` : ''}
                      </p>
                      <p className="mt-1 text-[11px] text-brand-muted">
                        محاولة {attempt.attemptNumber} — {formatDate(attempt.startedAt)}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold', STATUS_BADGE[attempt.status])}>
                      {attempt.status}
                    </span>
                  </div>
                  {attempt.scorePercent != null && (
                    <p className="mt-2 text-xs font-semibold text-brand-muted-strong">
                      الدرجة: {attempt.scorePercent}%{' '}
                      {attempt.passed
                        ? <span className="text-emerald-700">· ناجح</span>
                        : <span className="text-brand-accent">· راسب</span>}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void openAttempt(attempt)}
                    disabled={resultLoading}
                    className="mt-3 w-full rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white transition-colors duration-150 hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    فتح الإجابات
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-brand-border bg-brand-surface shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-brand-text">
              <ClipboardList className="h-4 w-4 shrink-0 text-brand-primary" />
              {resultAttempt ? `محاولة ${result?.attemptNumber} — ${resultAttempt.student.name || resultAttempt.student.email}` : 'التفاصيل'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttemptDetailBody result={result} resultAttempt={resultAttempt} onGraded={handleGraded} />
          </CardContent>
        </Card>
      </div>

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

      {/* ── Mobile (lg:hidden) — matches the Academic Precision grading frame ── */}
      <div className="lg:hidden">
        <div className="space-y-4 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-brand-text">صندوق التصحيح</h1>
              <p className="mt-0.5 text-xs text-brand-muted">تصحيح المحاولات المقالية</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              aria-label="تحديث"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              dir="rtl"
              placeholder="ابحث باسم الطالب أو البريد أو الاختبار..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
              className="w-full rounded-full border border-brand-border bg-brand-surface py-2.5 pe-10 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/30"
            />
          </div>

          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { setStatus(option.value as AttemptStatus | 'ALL'); setPage(1); }}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-150',
                  status === option.value
                    ? 'bg-brand-primary text-white'
                    : 'border border-brand-border bg-brand-surface text-brand-muted-strong hover:bg-brand-hover hover:text-brand-text',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-xs font-semibold text-brand-accent">
              {error}
            </p>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-brand-chip" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">لا توجد محاولات مطابقة.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((attempt) => {
                const active = resultAttempt?.id === attempt.id;
                return (
                  <li
                    key={attempt.id}
                    className={cn(
                      'rounded-xl border-s-2 px-4 py-3 transition-colors duration-150',
                      active
                        ? 'border-s-brand-primary bg-brand-primary/5'
                        : 'border-s-transparent bg-brand-chip/50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-brand-text">{attempt.student.name || attempt.student.email}</p>
                        <p className="mt-0.5 truncate text-xs text-brand-muted">{attempt.quizTitle} · {attempt.courseTitle}</p>
                        {attempt.videoTitle && (
                          <p className="truncate text-xs text-brand-muted">{attempt.videoTitle}</p>
                        )}
                        <p className="mt-1 text-[10px] text-brand-muted">
                          محاولة {attempt.attemptNumber} — {formatDate(attempt.startedAt)}
                        </p>
                      </div>
                      <span className={cn('shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold', STATUS_BADGE[attempt.status])}>
                        {attempt.status}
                      </span>
                    </div>
                    {attempt.scorePercent != null && (
                      <p className="mt-2 text-xs font-semibold text-brand-muted-strong">
                        الدرجة: {attempt.scorePercent}%{' '}
                        {attempt.passed
                          ? <span className="text-emerald-700">· ناجح</span>
                          : <span className="text-brand-accent">· راسب</span>}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void openAttempt(attempt)}
                      disabled={resultLoading}
                      className="mt-3 w-full rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white transition-colors duration-150 hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      فتح الإجابات
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Detail panel (mobile inline) */}
          <section ref={mobileDetailRef} className="rounded-2xl border border-brand-border bg-brand-surface p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-text">
              <ClipboardList className="h-4 w-4 shrink-0 text-brand-primary" />
              {resultAttempt ? `محاولة ${result?.attemptNumber} — ${resultAttempt.student.name || resultAttempt.student.email}` : 'التفاصيل'}
            </p>
            <AttemptDetailBody result={result} resultAttempt={resultAttempt} onGraded={handleGraded} />
          </section>

          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-brand-muted">عرض {rangeLabel} من {total}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-9 items-center rounded-full border border-brand-border bg-brand-surface px-3 text-xs font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text disabled:opacity-40"
              >
                السابق
              </button>
              <span className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-muted-strong">
                {page} / {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-9 items-center rounded-full border border-brand-border bg-brand-surface px-3 text-xs font-semibold text-brand-muted-strong transition-colors hover:bg-brand-hover hover:text-brand-text disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-brand-border bg-brand-chip px-4 py-3 text-xs leading-relaxed text-brand-muted-strong">
        <ClipboardList className="h-4 w-4 shrink-0 text-brand-primary" />
        <span>هام: تصحيح مقالي — نسبة النجاح تحسب من مجموع درجات الاختبار. اعتماد تصحيح المقالي يجعل المحاولة نهائية.</span>
      </div>
    </div>
  );
}