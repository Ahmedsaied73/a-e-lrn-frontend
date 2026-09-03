"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { startQuizAttempt } from "@/store/slices/quizSlice";
import type { QuizResultData, SubmitQuizData, McqResultQuestion, EssayResultQuestion } from "@/types/quiz";
import { CheckCircle, XCircle, Clock, RotateCcw, FileText } from "lucide-react";

interface FinalModeProps {
  result: QuizResultData;
  courseId: string;
  videoId: string;
}

interface PendingModeProps {
  submitResult: PendingSubmitResult;
  attemptId: number;
  courseId: string;
  videoId: string;
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

// SVG circular progress ring
function ScoreRing({ percent, earnedPoints, totalPoints }: {
  percent: number;
  earnedPoints: number | null;
  totalPoints: number | null;
}) {
  // r=70, circumference = 2π*70 ≈ 440
  const CIRC = 440;
  const offset = CIRC - (CIRC * Math.min(100, Math.max(0, percent))) / 100;

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 160 160">
        <circle cx="80" cy="80" fill="transparent" r="70" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="80" cy="80" fill="transparent" r="70"
          stroke="#207bff" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center leading-none">
        <span className="text-xs font-semibold text-slate-400 mb-1">الدرجة المستحقة</span>
        <div className="flex items-baseline font-black text-slate-900">
          <span className="text-4xl sm:text-5xl text-[#207bff]">{earnedPoints ?? "--"}</span>
          <span className="text-2xl text-slate-400 mx-1">/</span>
          <span className="text-2xl text-slate-600">{totalPoints ?? "--"}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md mt-1 border ${
          "text-slate-600 bg-slate-50 border-slate-200"
        }`}>
          {percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function formatDuration(startedAt: string, submittedAt: string | null): string {
  if (!submittedAt) return "--";
  const diff = new Date(submittedAt).getTime() - new Date(startedAt).getTime();
  if (diff < 0) return "--";
  const totalSec = Math.floor(diff / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return s > 0 ? `${m} د ${s} ث` : `${m} دقيقة`;
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
function FinalResult({ result, courseId, videoId }: FinalModeProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [retakeError, setRetakeError] = useState<string | null>(null);

  const mcqQuestions = result.questions.filter((q): q is McqResultQuestion => q.type === "radiogroup");
  const correctCount = mcqQuestions.filter((q) => q.isCorrect).length;
  const wrongCount = mcqQuestions.filter((q) => !q.isCorrect).length;
  const timeTaken = formatDuration(result.startedAt, result.submittedAt);
  const percent = result.scorePercent;
  const passed = result.passed;

  const handleRetake = async () => {
    setRetakeError(null);
    try {
      await dispatch(startQuizAttempt(videoId)).unwrap();
      router.push(`/course/${courseId}/video/${videoId}/quiz/run`);
    } catch (error: unknown) {
      setRetakeError(getErrorMessage(error, "تعذر بدء محاولة جديدة"));
    }
  };

  return (
    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 p-6 sm:p-10 text-center z-10 mx-auto">
      {/* Status header */}
      <div className="flex flex-col items-center">
        {/* Success/Fail pulse icon */}
        <div className="relative mb-3 flex items-center justify-center">
          <span className={`animate-ping absolute inline-flex h-16 w-16 rounded-full opacity-20 ${passed ? "bg-emerald-400" : "bg-rose-400"}`} />
          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-lg ${
            passed
              ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-emerald-500/10"
              : "bg-rose-50 border-rose-500 text-rose-600 shadow-rose-500/10"
          }`}>
            {passed
              ? <CheckCircle className="w-9 h-9" />
              : <XCircle className="w-9 h-9" />
            }
          </div>
        </div>

        <div className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full border text-sm font-bold mb-2 ${
          passed
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-rose-50 text-rose-700 border-rose-200"
        }`}>
          <span className={`w-2 h-2 rounded-full ${passed ? "bg-emerald-500" : "bg-rose-500"}`} />
          الحالة : {passed ? "ناجح ومتميز" : "لم يُجتز"}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          نتيجة الاختبار النهائي
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          تم تثبيت إجاباتك وتسجيل نتيجتك في سجلك الأكاديمي
        </p>
      </div>

      {/* Score ring */}
      <div className="mt-6 flex flex-col items-center justify-center">
        <ScoreRing percent={percent ?? 0} earnedPoints={result.earnedPoints} totalPoints={result.totalPoints} />
      </div>

      {/* Success/fail notification banner */}
      {passed ? (
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-right">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-900 leading-snug">مبارك! تم اجتياز الاختبار بنجاح فائق</h2>
            <p className="text-xs text-emerald-700 mt-0.5">تم فتح الدرس التالي تلقائياً في خطتك التعليمية.</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-right">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-rose-900 leading-snug">
              لم تجتز الاختبار — النسبة المطلوبة {result.passingScore}%
            </h2>
            <p className="text-xs text-rose-700 mt-0.5">يمكنك إعادة الاختبار مرة أخرى لتحسين درجتك.</p>
          </div>
        </div>
      )}

      {retakeError && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {retakeError}
        </p>
      )}

      {/* Metrics grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center text-center">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#207bff] flex items-center justify-center mb-1.5">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">الوقت المستغرق</span>
          <span className="text-sm font-bold text-slate-800 mt-0.5">{timeTaken}</span>
        </div>
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">الإجابات الصحيحة</span>
          <span className="text-sm font-bold text-emerald-600 mt-0.5">{correctCount} إجابة</span>
        </div>
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center text-center">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-1.5">
            <XCircle className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-slate-500">الإجابات الخاطئة</span>
          <span className="text-sm font-bold text-rose-500 mt-0.5">{wrongCount} إجابة</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-center">
        <button
          onClick={() => router.push(`/course/${courseId}/video/${videoId}/quiz/result/${result.attemptId}`)}
          className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-[#207bff] hover:bg-[#1a66d9] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition duration-150 active:scale-[0.99]"
        >
          <FileText className="w-5 h-5" />
          <span>مراجعة الإجابات النموذجية</span>
        </button>
        <button
          onClick={handleRetake}
          className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl border border-slate-300 shadow-sm transition duration-150 active:scale-[0.99]"
        >
          <RotateCcw className="w-5 h-5 text-slate-500" />
          <span>إعادة الاختبار</span>
        </button>
      </div>

      <div className="mt-5">
        <a
          href={`/course/${courseId}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#207bff] hover:text-blue-800 transition"
        >
          <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>العودة إلى محتوى الدورة التعليمية</span>
        </a>
      </div>
    </div>
  );
}

/** Pending / awaiting admin review view */
function PendingResult({ submitResult, attemptId, courseId, videoId }: PendingModeProps) {
  const router = useRouter();

  return (
    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 p-6 sm:p-10 text-center z-10 mx-auto">
      {/* Status icon */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-600 mb-4 shadow-lg shadow-amber-500/10">
          <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-bold mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          الحالة : بانتظار المراجعة
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          تم التسليم — بانتظار التصحيح
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-sm mx-auto">
          تم تسليم إجاباتك بنجاح. الأسئلة المقالية تنتظر مراجعة المصحح — ستصلك النتيجة النهائية قريباً.
        </p>
      </div>

      {/* Provisional MCQ score */}
      {submitResult.hasEssays && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right">
          <h2 className="text-sm font-bold text-amber-900 mb-1">الدرجة المؤقتة (الأسئلة الاختيارية فقط)</h2>
          <p className="text-2xl font-extrabold text-amber-700">
            {submitResult.earnedPoints} <span className="text-base font-semibold text-amber-500">/ {submitResult.totalPoints}</span>
          </p>
          <p className="text-xs text-amber-600 mt-1">* هذه الدرجة مؤقتة وتشمل الأسئلة الاختيارية فقط — ستتغير بعد تصحيح الأسئلة المقالية.</p>
        </div>
      )}

      {/* Action */}
      <div className="mt-8">
        <a
          href={`/course/${courseId}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#207bff] hover:text-blue-800 transition"
        >
          <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>العودة إلى محتوى الدورة التعليمية</span>
        </a>
      </div>
    </div>
  );
}

export default function QuizResultSummary(props: QuizResultSummaryProps) {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Background glows matching Stitch screen 4 */}
      <div className="absolute w-96 h-96 bg-[#207bff]/10 rounded-full blur-3xl pointer-events-none -top-10 right-1/4" />
      <div className="absolute w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none bottom-10 left-1/4" />

      {props.mode === "final" ? (
        <FinalResult
          result={props.result}
          courseId={props.courseId}
          videoId={props.videoId}
        />
      ) : (
        <PendingResult
          submitResult={props.submitResult}
          attemptId={props.attemptId}
          courseId={props.courseId}
          videoId={props.videoId}
        />
      )}
    </div>
  );
}
