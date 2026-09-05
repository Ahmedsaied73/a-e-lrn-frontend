"use client";

import { useState } from "react";
import type { ResultQuestion, McqResultQuestion, EssayResultQuestion, AttemptSummary } from "@/types/quiz";
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";

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

const ARABIC_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز"];

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
    case "SUBMITTED": return { text: "مسلّم", cls: "bg-blue-50 text-[#207bff] border-blue-100" };
    case "EXPIRED": return { text: "منتهية الصلاحية", cls: "bg-slate-100 text-slate-600 border-slate-200" };
    case "IN_PROGRESS": return { text: "قيد التنفيذ", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    default: return { text: status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

/** MCQ question review card */
function McqCard({ q, index }: { q: McqResultQuestion; index: number }) {
  const correct = q.isCorrect;

  return (
    <article className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      correct ? "border-slate-200/90" : "border-rose-200/80"
    }`}>
      {/* Card top bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        correct ? "bg-slate-50/80 border-slate-200/70" : "bg-rose-50/60 border-rose-200/60"
      }`}>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-md border ${
            correct
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-rose-100 text-rose-700 border-rose-200"
          }`}>
            السؤال رقم {index + 1} • {correct ? "إجابة صحيحة" : "إجابة غير صحيحة"}
          </span>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          درجة السؤال: <span className={`font-bold ${correct ? "text-emerald-600" : "text-rose-600"}`}>{q.earnedPoints}</span> / {q.maxPoints}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Question text — name serves as identifier */}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">{q.name}</h2>

        {/* Options display */}
        <div className="space-y-3">
          {/* Correct answer */}
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/70">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                ✓
              </span>
              <span className="text-slate-900 font-bold text-sm sm:text-base">{q.correctAnswer}</span>
            </div>
            <span className="hidden sm:inline-block text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
              الإجابة الصحيحة النموذجية
            </span>
          </div>

          {/* Student answer (if different from correct) */}
          {q.studentAnswer && q.studentAnswer !== q.correctAnswer && (
            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-rose-400 bg-rose-50/70">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-rose-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  ✗
                </span>
                <span className="text-slate-900 font-medium text-sm sm:text-base">{q.studentAnswer}</span>
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md">
                اختيارك غير الصحيح
              </span>
            </div>
          )}

          {/* No answer */}
          {!q.studentAnswer && (
            <div className="flex items-center p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm">
              <span>لم تتم الإجابة على هذا السؤال</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/** Essay question review card */
function EssayCard({ q, index }: { q: EssayResultQuestion; index: number }) {
  const isPending = q.status === "PENDING_REVIEW";
  const isGraded = q.status === "GRADED";

  return (
    <article className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      isPending ? "border-amber-200/80" : isGraded ? "border-slate-200/90" : "border-slate-200"
    }`}>
      {/* Card top bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        isPending ? "bg-amber-50/60 border-amber-200/60" : "bg-slate-50/80 border-slate-200/70"
      }`}>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-md border ${
            isPending
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-slate-100 text-slate-700 border-slate-200"
          }`}>
            السؤال رقم {index + 1} • سؤال مقالي
          </span>
          {isPending && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              قيد المراجعة
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-slate-500">
          درجة السؤال:{" "}
          <span className="font-bold">
            {isPending ? "--" : (q.earnedPoints ?? "--")}
          </span>{" "}
          / {q.maxPoints}
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">{q.name}</h2>

        {/* Student answer */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">إجابتك</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {q.studentAnswer || <span className="text-slate-400 italic">لم تتم الإجابة</span>}
          </div>
        </div>

        {/* Model answer — ONLY shown when GRADED */}
        {isGraded && (
          <div>
            <h3 className="text-xs font-bold text-[#207bff] uppercase tracking-wide mb-2">الإجابة النموذجية</h3>
            <div className="bg-[#eef6ff]/60 border border-blue-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {q.modelAnswer}
            </div>
          </div>
        )}

        {/* Feedback — ONLY when GRADED */}
        {isGraded && q.feedback && (
          <div className="bg-gradient-to-br from-[#eef6ff]/40 via-white to-slate-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-center gap-2 text-[#207bff] font-bold text-sm mb-2">
              <svg className="w-5 h-5 text-[#207bff] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <h3>تغذية راجعة من المصحح</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{q.feedback}</p>
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
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#207bff]" />
        <h2 className="font-bold text-slate-900">سجل المحاولات السابقة</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-right">رقم المحاولة</th>
              <th className="px-5 py-3 text-right">التاريخ</th>
              <th className="px-5 py-3 text-right">الحالة</th>
              <th className="px-5 py-3 text-right">النتيجة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attempts.map((a) => {
              const { text, cls } = statusLabel(a.status);
              return (
                <tr key={a.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">#{a.attemptNumber}</td>
                  <td className="px-5 py-3.5 text-slate-600">{formatDate(a.startedAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
                      {text}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {a.scorePercent != null ? (
                      <span className="font-bold text-slate-700">
                        {a.scorePercent.toFixed(1)}%
                        {a.earnedPoints != null && a.totalPoints != null && (
                          <span className="text-slate-400 font-normal ml-1">
                            ({a.earnedPoints}/{a.totalPoints})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400">--</span>
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
      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#eef6ff] flex items-center justify-center text-[#207bff]">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">مراجعة إجاباتك</p>
              <p className="text-sm font-semibold text-slate-700">الدرجات والحالة معروضة كما أرسلها الخادم</p>
            </div>
          </div>

          {/* Filter toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(["all", "wrong", "correct"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  filter === f
                    ? f === "wrong"
                      ? "bg-white text-rose-600 shadow-sm flex items-center gap-1.5"
                      : f === "correct"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f === "wrong" && filter === "wrong" && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                {f === "all" ? "الكل" : f === "wrong" ? "الأسئلة الخاطئة فقط" : "الأسئلة الصحيحة"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Question cards */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          لا توجد أسئلة تطابق هذا الفلتر.
        </div>
      ) : (
        paginated.map((q, i) => {
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
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>
          <span className="text-xs text-slate-500 font-medium">
            صفحة {currentPage + 1} من {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
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
