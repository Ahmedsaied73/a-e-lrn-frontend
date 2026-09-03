"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store/store";
import { fetchQuizMeta, startQuizAttempt, selectQuizMeta, selectQuizMetaStatus, selectQuizError } from "@/store/slices/quizSlice";
import { useQuizTimer } from "@/hooks/useQuizTimer";
import { Loader2, Lock, CheckCircle, Clock, FileQuestion, Award, Zap, ChevronLeft } from "lucide-react";

interface QuizIntroCardProps {
  videoId: number | string;
  courseId: string;
}

function formatSeconds(sec: number): string {
  if (sec < 60) return `${sec} ث`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}د ${s}ث` : `${m} دقيقة`;
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Skeleton shown while meta is loading */
function QuizIntroSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="bg-slate-100 h-24 w-full" />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 rounded-xl h-20" />
          ))}
        </div>
        <div className="bg-slate-100 rounded-xl h-32" />
        <div className="bg-slate-100 rounded-xl h-12 w-2/3 mx-auto" />
      </div>
    </div>
  );
}

/** Inline countdown for an in-progress attempt */
function InProgressCountdown({ deadlineAt }: { deadlineAt: string | null }) {
  const { remainingSec } = useQuizTimer(deadlineAt, () => {});
  if (remainingSec === null) return null;
  const urgent = remainingSec < 300;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${urgent ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
      <Clock className="w-3 h-3" />
      {formatTimer(remainingSec)}
    </span>
  );
}

export default function QuizIntroCard({ videoId, courseId }: QuizIntroCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const meta = useSelector(selectQuizMeta);
  const metaStatus = useSelector(selectQuizMetaStatus);
  const quizError = useSelector(selectQuizError);

  useEffect(() => {
    dispatch(fetchQuizMeta(videoId));
  }, [videoId, dispatch]);

  // Loading
  if (metaStatus === "idle" || metaStatus === "loading") {
    return <QuizIntroSkeleton />;
  }

  if (metaStatus === "failed") {
    return (
      <div dir="rtl" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-bold text-rose-800">تعذر تحميل بيانات الاختبار</p>
        <p className="mt-2 text-sm text-rose-700">{quizError || "يرجى المحاولة مرة أخرى لاحقاً."}</p>
        <button
          type="button"
          onClick={() => dispatch(fetchQuizMeta(videoId))}
          className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // No quiz on this video
  if (!meta || !meta.exists) {
    return null;
  }

  // From here: meta.exists === true
  const timeLimitDisplay = meta.timeLimitSec ? formatSeconds(meta.timeLimitSec) : "--";
  const totalQuestionsDisplay = meta.totalQuestions != null ? `${meta.totalQuestions} سؤال` : "--";
  const totalPointsDisplay = meta.totalPoints != null ? `${meta.totalPoints} درجة` : "--";
  const passingDisplay = `${meta.passingScore}%`;

  const handleStartOrResume = async () => {
    try {
      await dispatch(startQuizAttempt(videoId)).unwrap();
      router.push(`/course/${courseId}/video/${videoId}/quiz/run`);
    } catch {
      // Error handled in slice
    }
  };

  const isLocked = !meta.unlocked;
  const hasInProgress = !!meta.inProgressAttempt;
  const hasAttempted = meta.attempted;
  const hasPassed = meta.passed;

  // Determine button label and state
  let btnLabel = "بدء الاختبار الآن";
  let btnIcon = <ChevronLeft className="w-5 h-5" />;
  if (isLocked) {
    btnLabel = "الاختبار مقفل";
  } else if (hasInProgress) {
    btnLabel = "متابعة الاختبار";
  } else if (hasAttempted) {
    btnLabel = "إعادة الاختبار";
  }

  const currentScore = meta.bestScore != null ? meta.bestScore : null;
  return (
    <div dir="rtl" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Card Header Banner */}
      <div className="bg-slate-50/80 px-6 sm:px-8 py-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-[#eef6ff] text-[#207bff] text-xs font-bold rounded-full mb-2 border border-blue-100">
            الاختبار الأسبوعي
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{meta.title}</h2>
        </div>
        {currentScore != null && (
          <div className="flex flex-col items-center justify-center bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500 mb-0.5">الدرجة الحالية</span>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight" dir="ltr">
              {currentScore} / {meta.totalPoints ?? "--"}
            </span>
            {hasPassed && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-100">
                <CheckCircle className="w-3 h-3" /> ناجح
              </span>
            )}
            {hasAttempted && !hasPassed && (
              <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md mt-1 border border-rose-100">
                لم يُجتز بعد
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Time limit */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-center flex flex-col justify-center">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#207bff] mx-auto flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">وقت الامتحان</span>
            <span className="text-base font-bold text-slate-900 mt-0.5">{timeLimitDisplay}</span>
          </div>

          {/* Total questions */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-center flex flex-col justify-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-2">
              <FileQuestion className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">عدد الأسئلة</span>
            <span className="text-base font-bold text-slate-900 mt-0.5">{totalQuestionsDisplay}</span>
          </div>

          {/* Total points */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-center flex flex-col justify-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">الدرجة الكلية</span>
            <span className="text-base font-bold text-slate-900 mt-0.5">{totalPointsDisplay}</span>
          </div>

          {/* Passing score */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-center flex flex-col justify-center">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 block">نسبة النجاح</span>
            <span className="text-base font-bold text-slate-900 mt-0.5">{passingDisplay}</span>
          </div>
        </div>

        {/* Instructions */}
        {!isLocked && (
          <div className="bg-blue-50/40 rounded-xl p-5 sm:p-6 border border-blue-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#207bff] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              تعليمات هامة قبل بدء الاختبار:
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 pr-5 list-disc leading-relaxed">
              <li>يرجى التأكد من استقرار اتصال الإنترنت لديك طوال فترة الاختبار.</li>
              {meta.timeLimitSec && (
                <li>يبدأ العد التنازلي للوقت ({formatSeconds(meta.timeLimitSec)}) بمجرد الضغط على زر بدء الاختبار.</li>
              )}
              <li>سيتم تسليم الاختبار تلقائياً عند انتهاء الوقت المحدد.</li>
              <li>لا يمكن التراجع أو تعديل الإجابات بعد الضغط النهائي على زر &quot;تسليم الاختبار&quot;.</li>
            </ul>
          </div>
        )}

        {/* CTA Area */}
        <div className="pt-2 flex flex-col items-center gap-4">
          {isLocked ? (
            <div className="w-full sm:w-2/3 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 w-full justify-center">
                <Lock className="w-5 h-5" />
                <span className="font-bold text-sm">أكمل الفيديو أولاً لفتح الاختبار</span>
              </div>
              <button
                disabled
                className="w-full py-3.5 px-6 rounded-xl bg-slate-200 text-slate-400 font-bold text-base flex items-center justify-center gap-3 cursor-not-allowed"
              >
                <span>الاختبار مقفل</span>
                <Lock className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="w-full sm:w-2/3 flex flex-col items-center gap-3">
              {/* In-progress timer badge */}
              {hasInProgress && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 w-full justify-center">
                  <span className="text-sm font-semibold">محاولة قيد التنفيذ — الوقت المتبقي:</span>
                  <InProgressCountdown deadlineAt={meta.inProgressAttempt!.deadlineAt} />
                </div>
              )}

              <button
                onClick={handleStartOrResume}
                className="w-full py-3.5 px-6 rounded-xl bg-[#207bff] hover:bg-[#1a66d9] active:bg-[#1451b2] text-white font-bold text-base flex items-center justify-center gap-3 transition-all shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <span>{btnLabel}</span>
                {btnIcon}
              </button>

              {!hasInProgress && (
                <p className="text-xs text-slate-400 font-medium text-center">
                  بالضغط على بدء الاختبار، فإنك توافق بالالتزام بقواعد المنظومة الأكاديمية
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
