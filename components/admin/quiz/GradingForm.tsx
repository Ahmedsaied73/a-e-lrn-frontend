"use client";

import { useState } from "react";
import { gradeQuizAttempt } from "@/services/adminQuizService";
import type { GradeAttemptInput, QuizResultData } from "@/types/quiz";

interface GradingFormProps {
  attempt: { id: number; attemptNumber: number };
  result: QuizResultData;
  onGraded: () => void | Promise<void>;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "تعذر حفظ التصحيح.";
}

function isEssayQuestion(
  question: QuizResultData["questions"][number],
): question is Extract<QuizResultData["questions"][number], { type: "comment" }> {
  return question.type === "comment";
}

export default function GradingForm({ attempt, result, onGraded }: GradingFormProps) {
  const essayQuestions = result.questions.filter(isEssayQuestion);

  const initialScores = () => Object.fromEntries(essayQuestions.map((question) => [question.name, question.earnedPoints == null ? "" : String(question.earnedPoints)]));
  const initialFeedback = () => Object.fromEntries(essayQuestions.map((question) => [question.name, question.feedback ?? ""]));

  const [scores, setScores] = useState<Record<string, string>>(initialScores);
  const [feedback, setFeedback] = useState<Record<string, string>>(initialFeedback);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitGrade = async () => {
    const essayScores: Record<string, number> = {};
    for (const question of essayQuestions) {
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
      const input: GradeAttemptInput = { essayScores, essayFeedback: feedback };
      await gradeQuizAttempt(attempt.id, input);
      await onGraded();
    } catch (gradeError) {
      setError(errorMessage(gradeError));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-5">
      {essayQuestions.length === 0 ? (
        <p className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
          هذا الاختبار لا يحتوي على أسئلة مقالية — يعتمد التصحيح على نظام الاختيار من متعدد تلقائيًا.
          يمكنك اعتماد النتيجة أو إعادة المحاولة من القائمة.
        </p>
      ) : essayQuestions.map((question) => (
        <div key={question.name} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="font-bold text-slate-100">{question.name}</p>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-900/60 p-3 text-sm text-slate-300">
            إجابة الطالب: {question.studentAnswer || "لم تتم الإجابة"}
          </p>
          <p className="mt-2 text-sm text-slate-500">الإجابة النموذجية: {question.modelAnswer}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-200">
              الدرجة (الحد الأقصى {question.maxPoints})
              <input
                type="number"
                min="0"
                max={question.maxPoints}
                step="1"
                value={scores[question.name] ?? ""}
                onChange={(event) => setScores((current) => ({ ...current, [question.name]: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              ملاحظات
              <textarea
                value={feedback[question.name] ?? ""}
                onChange={(event) => setFeedback((current) => ({ ...current, [question.name]: event.target.value }))}
                className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
              />
            </label>
          </div>
        </div>
      ))}
      {error && <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm font-semibold text-rose-300">{error}</p>}
      {essayQuestions.length > 0 && (
        <button
          type="button"
          onClick={() => void submitGrade()}
          disabled={working}
          className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors duration-150 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {working ? "جاري الحفظ..." : "اعتماد التصحيح"}
        </button>
      )}
    </div>
  );
}