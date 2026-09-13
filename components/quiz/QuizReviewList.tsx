"use client";

import { useState } from "react";
import type { ResultQuestion, McqResultQuestion, EssayResultQuestion, AttemptSummary } from "@/types/quiz";
import { CheckCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface QuizReviewListProps {
  questions: ResultQuestion[];
  attempts?: AttemptSummary[];
}

type FilterMode = "all" | "wrong" | "correct";

function isEssay(q: ResultQuestion): q is EssayResultQuestion {
  return q.type === "comment";
}

function isMcq(q: ResultQuestion): q is McqResultQuestion {
  return q.type === "radiogroup";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: AttemptSummary["status"]): { text: string; cls: string } {
  switch (status) {
    case "GRADED": return { text: "مصحح", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "GRADING": return { text: "بانتظار التصحيح", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "SUBMITTED": return { text: "مسلّم", cls: "bg-brand-primary/10 text-brand-primary border-brand-primary/20" };
    case "EXPIRED": return { text: "منتهية الصلاحية", cls: "bg-brand-chip text-brand-muted border-brand-border" };
    case "IN_PROGRESS": return { text: "قيد التنفيذ", cls: "bg-brand-primary/10 text-brand-primary border-brand-primary/20" };
    default: return { text: status, cls: "bg-brand-chip text-brand-muted border-brand-border" };
  }
}

/** MCQ question review card */
function McqCard({ q, index }: { q: McqResultQuestion; index: number }) {
  const correct = q.isCorrect;

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-xs">
      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-xs font-semibold text-brand-muted">السؤال {index + 1}</p>
        <span
          className={
            "rounded-full px-3 py-1 text-xs font-bold " +
            (correct
              ? "bg-brand-primary/10 text-brand-primary"
              : "bg-brand-accent/10 text-brand-accent")
          }
        >
          {correct ? "إجابة صحيحة" : "إجابة خاطئة"}
        </span>
      </div>

      <div className="px-6 pb-6 sm:px-7 sm:pb-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold leading-relaxed text-brand-text">{q.name}</h2>
          <span className="shrink-0 text-xs font-semibold text-brand-muted">
            {q.earnedPoints} / {q.maxPoints}
          </span>
        </div>

        <ul className="mt-5 space-y-2">
          {q.correctAnswer != null ? (
            <>
              <li className="flex items-center justify-between rounded-lg bg-brand-primary/10 px-4 py-2.5 text-sm font-semibold text-brand-primary">
                <span>{q.correctAnswer}</span>
                <span className="text-xs">✓ الإجابة النموذجية</span>
              </li>
              {q.studentAnswer && q.studentAnswer !== q.correctAnswer && (
                <li className="flex items-center justify-between rounded-lg bg-brand-accent/10 px-4 py-2.5 text-sm text-brand-accent line-through">
                  <span>{q.studentAnswer}</span>
                  <span className="text-xs">اخترتَ هذه</span>
                </li>
              )}
            </>
          ) : (
            <li className="rounded-lg bg-brand-bg px-4 py-2.5 text-sm text-brand-muted">
              الإجابات النموذجية تظهر بعد اجتياز الاختبار
            </li>
          )}
          {!q.studentAnswer && (
            <li className="rounded-lg bg-brand-bg px-4 py-2.5 text-sm text-brand-muted">
              لم تتم الإجابة على هذا السؤال
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}

/** Essay question review card */
function EssayCard({ q, index }: { q: EssayResultQuestion; index: number }) {
  const isPending = q.status === "PENDING_REVIEW";
  const isGraded = q.status === "GRADED";

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-xs">
      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-xs font-semibold text-brand-muted">السؤال {index + 1} • سؤال مقالي</p>
        {isPending ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            قيد المراجعة
          </span>
        ) : (
          <span className="rounded-full bg-brand-chip px-3 py-1 text-xs font-bold text-brand-muted">
            {q.earnedPoints ?? "--"} / {q.maxPoints}
          </span>
        )}
      </div>

      <div className="space-y-5 px-6 pb-6 sm:px-7 sm:pb-7">
        <h2 className="text-base font-bold leading-relaxed text-brand-text">{q.name}</h2>

        {/* Student answer */}
        <div>
          <h3 className="mb-2 text-xs font-bold text-brand-muted">إجابتك</h3>
          <div className="whitespace-pre-wrap rounded-xl border border-brand-border bg-brand-bg p-4 text-sm leading-relaxed text-brand-muted-strong">
            {q.studentAnswer || <span className="italic text-brand-muted">لم تتم الإجابة</span>}
          </div>
        </div>

        {/* Model answer — ONLY shown when GRADED (backend withholds it pre-pass) */}
        {isGraded && q.modelAnswer && (
          <div>
            <h3 className="mb-2 text-xs font-bold text-brand-primary">الإجابة النموذجية</h3>
            <div className="whitespace-pre-wrap rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 text-sm leading-relaxed text-brand-muted-strong">
              {q.modelAnswer}
            </div>
          </div>
        )}

        {/* Feedback — ONLY when GRADED */}
        {isGraded && q.feedback && (
          <div className="border-s-2 border-brand-secondary/50 ps-4 text-sm leading-relaxed text-brand-muted-strong">
            <p className="mb-1 text-xs font-bold text-brand-secondary">تغذية راجعة من المصحح</p>
            {q.feedback}
          </div>
        )}
      </div>
    </article>
  );
}

/** Attempt history table */
function AttemptsHistory({ attempts }: { attempts: AttemptSummary[] }) {
  if (!attempts.length) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-xs">
      <div className="flex items-center gap-2 border-b border-brand-border px-6 py-4">
        <Clock className="h-5 w-5 text-brand-primary" />
        <h2 className="font-bold text-brand-text">سجل المحاولات السابقة</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-bg text-xs font-semibold text-brand-muted">
            <tr>
              <th className="px-5 py-3 text-right">رقم المحاولة</th>
              <th className="px-5 py-3 text-right">التاريخ</th>
              <th className="px-5 py-3 text-right">الحالة</th>
              <th className="px-5 py-3 text-right">النتيجة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {attempts.map((a) => {
              const { text, cls } = statusLabel(a.status);
              return (
                <tr key={a.id} className="transition hover:bg-brand-bg">
                  <td className="px-5 py-3.5 font-bold text-brand-text">#{a.attemptNumber}</td>
                  <td className="px-5 py-3.5 text-brand-muted-strong">{formatDate(a.startedAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
                      {text}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {a.scorePercent != null ? (
                      <span className="font-bold text-brand-muted-strong">
                        {a.scorePercent.toFixed(1)}%
                        {a.earnedPoints != null && a.totalPoints != null && (
                          <span className="ml-1 font-normal text-brand-muted">
                            ({a.earnedPoints}/{a.totalPoints})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-brand-muted">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function QuizReviewList({ questions, attempts }: QuizReviewListProps) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 5;

  const filteredQuestions = questions.filter((q) => {
    if (filter === "all") return true;
    if (filter === "wrong") {
      if (isMcq(q)) return !q.isCorrect;
      return false;
    }
    if (filter === "correct") {
      if (isMcq(q)) return q.isCorrect;
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);
  const paginated = filteredQuestions.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const handleFilter = (f: FilterMode) => {
    setFilter(f);
    setCurrentPage(0);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* The server remains the source of truth for all scores and grading. */}
      <section className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-xs sm:p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-brand-muted">مراجعة إجاباتك</p>
              <p className="text-sm font-semibold text-brand-muted-strong">الدرجات والحالة معروضة كما أرسلها الخادم</p>
            </div>
          </div>

          {/* Filter toggle */}
          <div className="flex items-center rounded-xl bg-brand-chip p-1">
            {(["all", "wrong", "correct"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFilter(f)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                  filter === f
                    ? f === "wrong"
                      ? "bg-brand-surface text-brand-accent shadow-xs"
                      : f === "correct"
                        ? "bg-brand-surface text-emerald-600 shadow-xs"
                        : "bg-brand-surface text-brand-text shadow-xs"
                    : "text-brand-muted hover:text-brand-text"
                }`}
              >
                {f === "all" ? "الكل" : f === "wrong" ? "الأسئلة الخاطئة فقط" : "الأسئلة الصحيحة"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Question cards */}
      {paginated.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-8 text-center text-brand-muted">
          لا توجد أسئلة تطابق هذا الفلتر.
        </div>
      ) : (
        paginated.map((q) => {
          const globalIdx = filteredQuestions.indexOf(q);
          return isMcq(q)
            ? <McqCard key={q.name} q={q} index={globalIdx} />
            : <EssayCard key={q.name} q={q as EssayResultQuestion} index={globalIdx} />;
        })
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </button>
          <span className="text-xs font-medium text-brand-muted">
            صفحة {currentPage + 1} من {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Attempt history */}
      {attempts && attempts.length > 0 && (
        <AttemptsHistory attempts={attempts} />
      )}
    </div>
  );
}
