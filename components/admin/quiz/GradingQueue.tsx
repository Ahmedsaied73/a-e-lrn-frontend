"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminAttemptResult,
  listQuizAttempts,
  resetQuizAttempt,
} from "@/services/adminQuizService";
import type { AdminQuizAttempt, QuizResultData } from "@/types/quiz";
import GradingForm from "./GradingForm";

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

export default function GradingQueue({ quizId }: GradingQueueProps) {
  const [attempts, setAttempts] = useState<AdminQuizAttempt[]>([]);
  const [selected, setSelected] = useState<QuizResultData | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<AdminQuizAttempt | null>(null);
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
    } catch (openError) {
      setError(errorMessage(openError));
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
      <section className="rounded-xl border border-slate-700/60 bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div><h1 className="text-xl font-bold text-slate-100">طابور التصحيح</h1><p className="text-sm text-slate-400">المحاولات التي تنتظر تصحيح الأسئلة المقالية.</p></div>
          <button type="button" onClick={() => void loadAttempts()} className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:border-slate-400">تحديث</button>
        </div>
        {loading ? <p className="mt-6 text-sm text-slate-400">جاري التحميل...</p> : attempts.length === 0 ? <p className="mt-6 text-sm text-slate-400">لا توجد محاولات معلقة.</p> : <div className="mt-5 space-y-3">
          {attempts.map((attempt) => <div key={attempt.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-100">{attempt.user?.name || attempt.user?.email || `المستخدم ${attempt.userId}`}</p><p className="text-xs text-slate-500">محاولة {attempt.attemptNumber} — {new Date(attempt.startedAt).toLocaleString("ar-EG")}</p></div><span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">{attempt.status}</span></div>
            <div className="mt-3 flex gap-2"><button type="button" onClick={() => void openAttempt(attempt)} disabled={working} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 transition-colors duration-150 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed">فتح الإجابات</button><button type="button" onClick={() => void resetAttempt(attempt)} disabled={working} className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-300 transition-colors duration-150 hover:border-rose-400 hover:text-rose-200 disabled:opacity-50 disabled:cursor-not-allowed">إعادة المحاولة</button></div>
          </div>)}
        </div>}
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-card p-6">
        {!selected ? <p className="text-sm text-slate-400">اختر محاولة لعرض الإجابات المقالية وتصحيحها.</p> : (
          <div>
            <h2 className="text-lg font-bold text-slate-100">تصحيح محاولة {selected.attemptNumber}</h2>
            <div className="mt-5">
              <GradingForm
                key={selectedAttempt?.id}
                attempt={selectedAttempt!}
                result={selected}
                onGraded={async () => {
                  setSelected(null);
                  setSelectedAttempt(null);
                  await loadAttempts();
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => void resetAttempt(selectedAttempt!)}
              disabled={working}
              className="mt-4 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-300 transition-colors duration-150 hover:border-rose-400 hover:text-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
      </section>
      {error && <p role="alert" className="lg:col-span-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm font-semibold text-rose-300">{error}</p>}
    </div>
  );
}