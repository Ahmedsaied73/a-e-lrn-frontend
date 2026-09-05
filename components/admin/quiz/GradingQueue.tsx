"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminAttemptResult,
  gradeQuizAttempt,
  listQuizAttempts,
  resetQuizAttempt,
} from "@/services/adminQuizService";
import type { AdminQuizAttempt, QuizResultData } from "@/types/quiz";

interface GradingQueueProps {
  quizId: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "تعذر تنفيذ العملية.";
}

function isEssayQuestion(
  question: QuizResultData["questions"][number],
): question is Extract<QuizResultData["questions"][number], { type: "comment" }> {
  return question.type === "comment";
}

export default function GradingQueue({ quizId }: GradingQueueProps) {
  const [attempts, setAttempts] = useState<AdminQuizAttempt[]>([]);
  const [selected, setSelected] = useState<QuizResultData | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<AdminQuizAttempt | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAttempts(await listQuizAttempts(quizId));
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  const openAttempt = async (attempt: AdminQuizAttempt) => {
    setWorking(true);
    setError(null);
    try {
      const result = await getAdminAttemptResult(attempt.id);
      setSelectedAttempt(attempt);
      setSelected(result);
      const essayQuestions = result.questions.filter(isEssayQuestion);
      setScores(Object.fromEntries(essayQuestions.map((question) => [question.name, question.earnedPoints == null ? "" : String(question.earnedPoints)])));
      setFeedback(Object.fromEntries(essayQuestions.map((question) => [question.name, question.feedback ?? ""])));
    } catch (openError) {
      setError(errorMessage(openError));
    } finally {
      setWorking(false);
    }
  };

  const submitGrade = async () => {
    if (!selectedAttempt || !selected) return;
    const essayScores: Record<string, number> = {};
    for (const question of selected.questions) {
      if (question.type !== "comment") continue;
      const value = Number(scores[question.name]);
      if (!Number.isFinite(value) || value < 0 || value > question.maxPoints) {
        setError(`أدخل درجة صحيحة بين 0 و${question.maxPoints} للسؤال ${question.name}.`);
        return;
      }
      essayScores[question.name] = value;
    }

    setWorking(true);
    setError(null);
    try {
      await gradeQuizAttempt(selectedAttempt.id, { essayScores, essayFeedback: feedback });
      setSelected(null);
      setSelectedAttempt(null);
      await loadAttempts();
    } catch (gradeError) {
      setError(errorMessage(gradeError));
    } finally {
      setWorking(false);
    }
  };

  const resetAttempt = async (attempt: AdminQuizAttempt) => {
    if (!window.confirm("سيتم حذف هذه المحاولة والسماح بمحاولة جديدة. هل تريد المتابعة؟")) return;
    setWorking(true);
    setError(null);
    try {
      await resetQuizAttempt(attempt.id);
      if (selectedAttempt?.id === attempt.id) {
        setSelected(null);
        setSelectedAttempt(null);
      }
      await loadAttempts();
    } catch (resetError) {
      setError(errorMessage(resetError));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div dir="rtl" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div><h1 className="text-xl font-bold text-slate-900">طابور التصحيح</h1><p className="text-sm text-slate-500">المحاولات التي تنتظر تصحيح الأسئلة المقالية.</p></div>
          <button type="button" onClick={() => void loadAttempts()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">تحديث</button>
        </div>
        {loading ? <p className="mt-6 text-sm text-slate-500">جاري التحميل...</p> : attempts.length === 0 ? <p className="mt-6 text-sm text-slate-500">لا توجد محاولات معلقة.</p> : <div className="mt-5 space-y-3">
          {attempts.map((attempt) => <div key={attempt.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{attempt.user?.name || attempt.user?.email || `المستخدم ${attempt.userId}`}</p><p className="text-xs text-slate-500">محاولة {attempt.attemptNumber} — {new Date(attempt.startedAt).toLocaleString("ar-EG")}</p></div><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{attempt.status}</span></div>
            <div className="mt-3 flex gap-2"><button type="button" onClick={() => void openAttempt(attempt)} disabled={working} className="rounded-lg bg-[#207bff] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">فتح الإجابات</button><button type="button" onClick={() => void resetAttempt(attempt)} disabled={working} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">إعادة المحاولة</button></div>
          </div>)}
        </div>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {!selected ? <p className="text-sm text-slate-500">اختر محاولة لعرض الإجابات المقالية وتصحيحها.</p> : <>
          <h2 className="text-lg font-bold text-slate-900">تصحيح محاولة {selected.attemptNumber}</h2>
          <div className="mt-5 space-y-5">{selected.questions.filter(isEssayQuestion).map((question) => <div key={question.name} className="rounded-xl border border-slate-200 p-4">
            <p className="font-bold text-slate-800">{question.name}</p><p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">إجابة الطالب: {question.studentAnswer || "لم تتم الإجابة"}</p><p className="mt-2 text-sm text-slate-500">الإجابة النموذجية: {question.modelAnswer}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">الدرجة (الحد الأقصى {question.maxPoints})<input type="number" min="0" max={question.maxPoints} step="1" value={scores[question.name] ?? ""} onChange={(event) => setScores((current) => ({ ...current, [question.name]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label><label className="text-sm font-semibold text-slate-700">ملاحظات<textarea value={feedback[question.name] ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [question.name]: event.target.value }))} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-2.5" /></label></div>
          </div>)}</div>
          <button type="button" onClick={() => void submitGrade()} disabled={working} className="mt-5 rounded-lg bg-emerald-600 px-4 py-2.5 font-bold text-white disabled:opacity-50">{working ? "جاري الحفظ..." : "اعتماد التصحيح"}</button>
        </>}
      </section>
      {error && <p role="alert" className="lg:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
    </div>
  );
}
