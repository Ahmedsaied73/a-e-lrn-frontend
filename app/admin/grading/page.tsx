'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminAttemptResult, gradeQuizAttempt, listAllAdminAttempts } from '@/services/adminQuizService';
import type { AdminGlobalAttempt } from '@/types/admin';
import type { EssayResultQuestion, QuizResultData } from '@/types/quiz';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes.toLocaleString('ar-EG')} دقيقة`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours.toLocaleString('ar-EG')} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'أمس';
  return `منذ ${diffDays.toLocaleString('ar-EG')} أيام`;
}

export default function AdminGradingPage() {
  const [attempts, setAttempts] = useState<AdminGlobalAttempt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [approvedIds, setApprovedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAllAdminAttempts({
        status: 'GRADING',
        limit: 50,
      });
      setAttempts(res.data);
      setTotal(res.meta.total);
      if (res.data.length > 0 && selectedId === null) {
        setSelectedId(res.data[0].id);
      }
    } catch {
      setError('تعذر تحميل محاولات صندوق التصحيح.');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  // Load result details when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    async function loadResult() {
      setResultLoading(true);
      try {
        const data = await getAdminAttemptResult(selectedId!);
        if (!cancelled) {
          setResult(data);

          // Seed score with existing earned points or AI suggested if available
          const essayQ = data.questions.find((q): q is EssayResultQuestion => q.type === 'comment');
          if (essayQ && essayQ.earnedPoints != null) {
            setScores((prev) => ({ ...prev, [selectedId!]: essayQ.earnedPoints! }));
          }
        }
      } catch {
        if (!cancelled) {
          toast.error('تعذر تحميل تفاصيل المحاولة.');
        }
      } finally {
        if (!cancelled) setResultLoading(false);
      }
    }

    void loadResult();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedAttempt = useMemo(
    () => attempts.find((a) => a.id === selectedId),
    [attempts, selectedId]
  );

  const essayQuestion = useMemo(() => {
    if (!result?.questions) return null;
    return (result.questions.find((q) => q.type === 'comment') as EssayResultQuestion) || null;
  }, [result]);

  const isApproved = selectedId ? approvedIds.includes(selectedId) : false;
  const maxScore = essayQuestion?.maxPoints || 5;

  // AI suggestion calculation
  const aiSuggested =
    essayQuestion?.earnedPoints != null
      ? essayQuestion.earnedPoints
      : Math.round(maxScore * 0.8);

  const aiConfidence =
    essayQuestion?.confidence && essayQuestion.confidence >= 0.8
      ? 'عالية'
      : 'متوسطة';

  const currentScore = selectedId != null && scores[selectedId] !== undefined
    ? scores[selectedId]
    : aiSuggested;

  const handleApproveGrading = async () => {
    if (!selectedId || !essayQuestion) return;

    setSubmitting(true);
    try {
      await gradeQuizAttempt(selectedId, {
        essayScores: { [essayQuestion.name]: currentScore },
        essayFeedback: notes[selectedId] ? { [essayQuestion.name]: notes[selectedId] } : undefined,
      });

      toast.success('تم اعتماد التصحيح بنجاح.');
      setApprovedIds((prev) => [...prev, selectedId]);

      // Refresh attempts list
      const res = await listAllAdminAttempts({ status: 'GRADING', limit: 50 });
      setAttempts(res.data);
      setTotal(res.meta.total);

      // Select next attempt if available
      const nextAttempt = res.data.find((a) => a.id !== selectedId);
      if (nextAttempt) {
        setSelectedId(nextAttempt.id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل اعتماد التصحيح.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = attempts.filter((a) => !approvedIds.includes(a.id)).length;

  return (
    <>
      <PageTitle title={adminTitle('تصحيح المقالي')} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Header matching design */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-brand-text">صندوق تصحيح المقالي</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {pendingCount.toLocaleString('ar-EG')} محاولة بانتظار الاعتماد — الذكاء الاصطناعي يقترح درجة أولية توفّر عليك وقت القراءة.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-4 text-xs font-semibold text-brand-accent">
            {error}
          </div>
        )}

        {/* 2-Column Layout matching design */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left Column: Attempt Queue */}
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:block lg:space-y-2 lg:px-0 lg:pb-0">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-64 shrink-0 rounded-xl border border-brand-border bg-brand-surface p-3 lg:w-full">
                  <Skeleton className="h-4 w-28 bg-brand-chip" />
                  <Skeleton className="mt-2 h-3 w-40 bg-brand-chip" />
                </div>
              ))
            ) : attempts.length === 0 ? (
              <p className="py-8 text-center text-xs text-brand-muted">
                لا توجد محاولات بانتظار التصحيح حالياً.
              </p>
            ) : (
              attempts.map((a) => {
                const done = approvedIds.includes(a.id);
                const active = a.id === selectedId;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={
                      'w-64 shrink-0 rounded-xl border-s-2 px-4 py-3 text-start transition lg:w-full ' +
                      (active
                        ? 'border-s-brand-primary bg-brand-primary/5 shadow-sm'
                        : 'border-s-transparent bg-brand-surface hover:bg-brand-hover')
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-brand-text">{a.student.name}</p>
                      {done ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          معتمد
                        </span>
                      ) : (
                        <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-xs font-bold text-brand-accent">
                          بانتظار
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-brand-muted">
                      {a.quizTitle || 'اختبار'}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {formatRelativeTime(a.submittedAt || a.startedAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Grading Details & AI Suggestions */}
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-sm sm:p-6">
            {resultLoading ? (
              <div className="space-y-4 py-8">
                <Skeleton className="h-4 w-32 bg-brand-chip" />
                <Skeleton className="h-6 w-3/4 bg-brand-chip" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-28 w-full rounded-xl bg-brand-chip" />
                  <Skeleton className="h-28 w-full rounded-xl bg-brand-chip" />
                </div>
              </div>
            ) : !selectedAttempt || !essayQuestion ? (
              <p className="py-16 text-center text-sm text-brand-muted">
                {attempts.length === 0
                  ? 'صندوق التصحيح فارغ حالياً — كل شيء مصحح!'
                  : 'إجابة الطالب لم تُسجَّل لهذه المحاولة أو لا يوجد سؤال مقالي.'}
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold text-brand-primary">
                  {selectedAttempt.quizTitle || 'اختبار'}
                </p>
                <h2 className="mt-2 text-base font-bold leading-relaxed text-brand-text">
                  {essayQuestion.name}
                </h2>

                {/* Answers Comparison Cards */}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-bold text-brand-muted">إجابة الطالب</p>
                    <div className="min-h-[100px] rounded-lg bg-brand-bg p-3.5 text-sm leading-relaxed text-brand-text">
                      {essayQuestion.studentAnswer || (
                        <span className="italic text-brand-muted">لم يكتب الطالب إجابة</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-bold text-brand-muted">الإجابة النموذجية</p>
                    <div className="min-h-[100px] rounded-lg border border-brand-border p-3.5 text-sm leading-relaxed text-brand-muted-strong">
                      {essayQuestion.modelAnswer || (
                        <span className="italic text-brand-muted">لا توجد إجابة نموذجية مسجلة</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Suggestion Box */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-s-2 border-s-brand-secondary bg-brand-secondary/5 px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-brand-secondary">اقتراح الذكاء الاصطناعي</p>
                    <p className="mt-0.5 text-sm text-brand-text">
                      درجة مقترحة:{' '}
                      <span className="font-extrabold">
                        {aiSuggested} / {maxScore}
                      </span>
                      <span className="ms-2 text-xs text-brand-muted">ثقة {aiConfidence}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      selectedId &&
                      setScores((s) => ({ ...s, [selectedId]: aiSuggested }))
                    }
                    className="rounded-full border border-brand-secondary px-3.5 py-1.5 text-xs font-bold text-brand-secondary transition hover:bg-brand-secondary/10"
                  >
                    قبول الاقتراح
                  </button>
                </div>

                {/* Score & Notes Form */}
                <div className="mt-5 flex flex-wrap items-end gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-brand-text">
                      الدرجة النهائية
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={maxScore}
                        value={currentScore}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (selectedId) {
                            setScores((s) => ({ ...s, [selectedId]: Math.min(maxScore, Math.max(0, val)) }));
                          }
                        }}
                        className="w-20 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-center text-sm font-bold text-brand-text outline-none focus:border-brand-primary"
                      />
                      <span className="text-sm text-brand-muted">/ {maxScore}</span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block text-xs font-bold text-brand-text">
                      ملاحظات للطالب (اختياري)
                    </label>
                    <input
                      value={(selectedId && notes[selectedId]) || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (selectedId) {
                          setNotes((n) => ({ ...n, [selectedId]: val }));
                        }
                      }}
                      placeholder="مثال: أحسنت الشرح، راجع الفرق بين الرابطة σ وπ"
                      className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Approve Button */}
                <button
                  type="button"
                  onClick={handleApproveGrading}
                  disabled={isApproved || submitting}
                  className={
                    'mt-5 w-full rounded-full px-6 py-2.5 text-sm font-bold transition sm:w-auto ' +
                    (isApproved
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50')
                  }
                >
                  {submitting
                    ? 'جارٍ الاعتماد...'
                    : isApproved
                    ? 'تم اعتماد التصحيح ✓'
                    : 'اعتماد التصحيح'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}