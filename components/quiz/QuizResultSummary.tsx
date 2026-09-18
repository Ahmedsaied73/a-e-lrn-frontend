"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { startQuizAttempt } from "@/store/slices/quizSlice";
import type { QuizResultData, SubmitQuizData, McqResultQuestion } from "@/types/quiz";

interface FinalModeProps {
  result: QuizResultData;
  courseSlug: string;
  videoSlug: string;
}

interface PendingModeProps {
  submitResult: PendingSubmitResult;
  attemptId: number;
  courseSlug: string;
  videoSlug: string;
}

type PendingSubmitResult = Omit<SubmitQuizData, "status" | "earnedPoints" | "totalPoints" | "scorePercent"> & {
  status: SubmitQuizData["status"];
  earnedPoints: number | null;
  totalPoints: number | null;
  scorePercent: number | null;
};

type QuizResultSummaryProps =
  | ({ mode: "final" } & FinalModeProps)
  | ({ mode: "pending" } & PendingModeProps);

function formatDuration(startedAt: string, submittedAt: string | null): string {
  if (!submittedAt) return "--";
  const diff = new Date(submittedAt).getTime() - new Date(startedAt).getTime();
  if (diff < 0) return "--";
  const totalSec = Math.floor(diff / 1000);
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

/** Final graded result view */
function FinalResult({ result, courseSlug, videoSlug }: FinalModeProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [retakeError, setRetakeError] = useState<string | null>(null);

  const mcqQuestions = result.questions.filter((q): q is McqResultQuestion => q.type === "radiogroup");
  const correctCount = mcqQuestions.filter((q) => q.isCorrect).length;
  const totalCount = mcqQuestions.length;
  const timeTaken = formatDuration(result.startedAt, result.submittedAt);
  const percent = Math.round(result.scorePercent ?? 0);
  const passed = result.passed;

  const handleRetake = async () => {
    setRetakeError(null);
    try {
      await dispatch(startQuizAttempt(videoSlug)).unwrap();
      router.push(`/course/${courseSlug}/video/${videoSlug}/quiz/run`);
    } catch (error: unknown) {
      setRetakeError(getErrorMessage(error, "تعذر بدء محاولة جديدة"));
    }
  };

  return (
    <div dir="rtl" className="mx-auto max-w-lg px-4 py-14 text-center sm:px-6">
      <span
        className={
          "inline-block rounded-full px-3 py-1 text-xs font-bold " +
          (passed ? "bg-brand-primary/10 text-brand-primary" : "bg-brand-accent/10 text-brand-accent")
        }
      >
        {passed ? "اجتزت الاختبار بنجاح" : "لم تحقق الحد الأدنى للنجاح"}
      </span>
      <h1 className="mt-3 text-xl font-extrabold text-brand-text">نتيجة الاختبار</h1>

      <div className="my-10 flex justify-center">
        <div
          className="relative grid h-48 w-48 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--color-brand-primary) ${percent * 3.6}deg, var(--color-brand-bg) 0deg)`,
          }}
        >
          <div className="grid h-36 w-36 place-items-center rounded-full bg-brand-surface">
            <div>
              <p className="text-4xl font-extrabold text-brand-text">{percent}٪</p>
              <p className="mt-1 text-xs text-brand-muted">{correctCount} من {totalCount} إجابة صحيحة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-brand-border py-4 text-sm text-brand-muted-strong">
        <span>الإجابات الصحيحة: {correctCount}</span>
        <span className="text-brand-muted">|</span>
        <span>الإجابات الخاطئة: {totalCount - correctCount}</span>
        <span className="text-brand-muted">|</span>
        <span>الوقت المستغرق: {timeTaken}</span>
      </div>

      {retakeError && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-brand-accent">
          {retakeError}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:justify-center">
        {!passed && (
          <button
            onClick={handleRetake}
            className="rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-ink/90"
          >
            إعادة الاختبار
          </button>
        )}
        <a
          href="#quiz-review"
          className="rounded-full border border-brand-border px-6 py-3 text-sm font-bold text-brand-muted-strong transition hover:bg-brand-surface"
        >
          مراجعة الإجابات النموذجية
        </a>
      </div>
    </div>
  );
}

/** Pending / awaiting admin review view */
function PendingResult({ submitResult, courseSlug }: PendingModeProps) {
  return (
    <div dir="rtl" className="mx-auto max-w-lg px-4 py-14 text-center sm:px-6">
      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        بانتظار التصحيح
      </span>
      <h1 className="mt-3 text-xl font-extrabold text-brand-text">تم التسليم — بانتظار التصحيح</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-brand-muted">
        تم تسليم إجاباتك بنجاح. الأسئلة المقالية تنتظر مراجعة المصحح — ستصلك النتيجة النهائية قريباً.
      </p>

      {submitResult.hasEssays && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-right">
          <h2 className="mb-1 text-sm font-bold text-amber-900">الدرجة المؤقتة (الأسئلة الاختيارية فقط)</h2>
          <p className="text-2xl font-extrabold text-amber-700">
            {submitResult.earnedPoints} <span className="text-base font-semibold text-amber-500">/ {submitResult.totalPoints}</span>
          </p>
          <p className="mt-1 text-xs text-amber-600">* هذه الدرجة مؤقتة وتشمل الأسئلة الاختيارية فقط — ستتغير بعد تصحيح الأسئلة المقالية.</p>
        </div>
      )}

      <div className="mt-8">
        <a
          href={`/course/${courseSlug}`}
          className="text-sm font-semibold text-brand-muted hover:text-brand-primary"
        >
          العودة إلى محتوى الدورة
        </a>
      </div>
    </div>
  );
}

export default function QuizResultSummary(props: QuizResultSummaryProps) {
  if (props.mode === "final") {
    return (
      <FinalResult
        result={props.result}
        courseSlug={props.courseSlug}
        videoSlug={props.videoSlug}
      />
    );
  }
  return (
    <PendingResult
      submitResult={props.submitResult}
      attemptId={props.attemptId}
      courseSlug={props.courseSlug}
      videoSlug={props.videoSlug}
    />
  );
}
