"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/reveal";
import { AppDispatch } from "@/store/store";
import { fetchQuizMeta, startQuizAttempt, selectQuizMeta, selectQuizMetaStatus, selectQuizError } from "@/store/slices/quizSlice";

interface QuizIntroCardProps {
  videoId: number | string;
  courseId: string;
}

const RULES = [
  "الوقت يبدأ بمجرد الضغط على «ابدأ الاختبار» ولا يتوقف عند إغلاق الصفحة.",
  "يمكنك التنقل بين الأسئلة بحرية وتعديل إجاباتك قبل التسليم النهائي.",
  "تظهر النتيجة والتصحيح التفصيلي فور تسليم الاختبار أو انتهاء الوقت.",
];

function formatMinutes(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m} دقيقة و ${s} ثانية` : `${m} دقيقة`;
}

/** Skeleton shown while meta is loading */
function QuizIntroSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-12 sm:px-6">
      <div className="h-4 w-40 rounded bg-brand-chip" />
      <div className="mt-4 h-9 w-2/3 rounded-lg bg-brand-chip" />
      <div className="mt-6 h-14 rounded-lg bg-brand-chip" />
      <div className="mt-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-brand-chip" />
        ))}
      </div>
      <div className="mx-auto mt-10 h-12 w-56 rounded-full bg-brand-chip" />
    </div>
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
      <div dir="rtl" className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
        <p className="text-base font-bold text-brand-text">تعذر تحميل بيانات الاختبار</p>
        <p className="mt-2 text-sm text-brand-muted">{quizError || "يرجى المحاولة مرة أخرى لاحقاً."}</p>
        <button
          type="button"
          onClick={() => dispatch(fetchQuizMeta(videoId))}
          className="mt-6 rounded-full bg-brand-primary px-8 py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90"
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
  const timeLimitDisplay = meta.timeLimitSec ? formatMinutes(meta.timeLimitSec) : "بدون حد زمني";

  const handleStartOrResume = async () => {
    try {
      await dispatch(startQuizAttempt(videoId)).unwrap();
      router.push(`/course/${courseId}/video/${videoId}/quiz/run`);
    } catch {
      // Error handled in slice. On 409 ALREADY_PASSED the meta refresh below
      // shows the success state; on MAX_ATTEMPTS_REACHED it shows the
      // exhausted state.
      dispatch(fetchQuizMeta(videoId));
    }
  };

  const isLocked = !meta.unlocked;
  const hasInProgress = !!meta.inProgressAttempt;
  const hasPassed = meta.passed;
  const outOfAttempts = meta.atMaxAttempts;
  // Submitted but no graded score yet (e.g. essay awaiting a grader) —
  // EXPIRED attempts don't count as used, so any used-but-scoreless
  // attempt is sitting in the grading pipeline.
  const isPendingReview = meta.attempted && meta.bestScore == null && !hasPassed && !hasInProgress;

  // Passed outranks exhausted (the user passed with their last attempt;
  // that's a success, not a dead end).
  let btnLabel = "ابدأ الاختبار الآن";
  if (hasInProgress) {
    btnLabel = "متابعة الاختبار";
  } else if (meta.attempted && !hasPassed && !outOfAttempts) {
    btnLabel = "إعادة الاختبار";
  }

  const showCta = !isLocked && !hasPassed && !outOfAttempts;
  const attemptsLine = `المحاولات المستخدمة: ${meta.attemptsUsed} من ${meta.maxAttempts}`;

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-8 text-xs text-brand-muted">
        <Link href="/grades/1" className="hover:text-brand-primary">الدورات</Link>
        <span className="mx-1.5">/</span>
        <span className="text-brand-muted">اختبار المحاضرة</span>
      </nav>

      <Reveal>
        <p className="text-sm font-semibold text-brand-primary">اختبار المحاضرة</p>
        <h1 className="mt-2 text-2xl font-extrabold text-brand-text sm:text-3xl">{meta.title}</h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-brand-border py-4 text-sm text-brand-muted-strong">
          <span>{meta.totalQuestions} أسئلة</span>
          <span className="text-brand-muted">|</span>
          <span>{timeLimitDisplay}</span>
          <span className="text-brand-muted">|</span>
          <span>{meta.totalPoints} درجة</span>
          <span className="text-brand-muted">|</span>
          <span>نسبة النجاح {meta.passingScore}٪</span>
        </div>
        <p className="mt-3 text-xs text-brand-muted">{attemptsLine}</p>
      </Reveal>

      <Reveal delayMs={90} className="mt-8">
        <p className="text-sm font-bold text-brand-text">قبل أن تبدأ</p>
        <ol className="mt-3 space-y-3">
          {RULES.map((r, i) => (
            <li key={r} className="flex gap-3 border-s-2 border-brand-primary/30 ps-4 text-sm leading-relaxed text-brand-muted-strong">
              <span className="font-mono text-brand-primary">{String(i + 1).padStart(2, "0")}</span>
              {r}
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal delayMs={140} className="mt-10 flex flex-col items-center gap-3">
        {!isLocked && quizError && (
          <p role="alert" className="text-sm font-semibold text-brand-accent">{quizError}</p>
        )}

        {isPendingReview && (
          <div className="flex flex-col items-center gap-1.5">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">بانتظار التصحيح</span>
            <p className="text-xs text-brand-muted">أُرسلت إجاباتك للتصحيح — ستظهر النتيجة النهائية هنا قريباً</p>
          </div>
        )}

        {isLocked ? (
          <>
            <p className="text-sm font-semibold text-amber-700">أكمل الفيديو أولاً لفتح الاختبار</p>
            <span className="w-full cursor-not-allowed rounded-full bg-brand-chip py-3.5 text-center text-sm font-bold text-brand-muted sm:w-auto sm:px-10">
              الاختبار مقفل
            </span>
          </>
        ) : hasPassed ? (
          <>
            <p className="text-sm font-semibold text-emerald-700">
              لقد اجتزت هذا الاختبار بنجاح{meta.bestScore != null ? ` بنسبة ${meta.bestScore}%` : ""} — لا حاجة لإعادة المحاولة
            </p>
            <span className="w-full cursor-not-allowed rounded-full bg-emerald-100 py-3.5 text-center text-sm font-bold text-emerald-700 sm:w-auto sm:px-10">
              اجتزت الاختبار بنجاح
            </span>
          </>
        ) : outOfAttempts ? (
          <>
            <p className="text-sm font-semibold text-brand-accent">لقد استنفدت جميع محاولات هذا الاختبار ({meta.maxAttempts})</p>
            <span className="w-full cursor-not-allowed rounded-full bg-brand-chip py-3.5 text-center text-sm font-bold text-brand-muted sm:w-auto sm:px-10">
              انتهت المحاولات
            </span>
          </>
        ) : showCta ? (
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row-reverse sm:justify-center">
            <button
              onClick={handleStartOrResume}
              className="w-full rounded-full bg-brand-primary py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-brand-primary/90 sm:w-auto sm:px-10"
            >
              {btnLabel}
            </button>
            <Link
              href={`/course/${courseId}/video/${videoId}`}
              className="text-sm font-semibold text-brand-muted hover:text-brand-primary"
            >
              العودة إلى الدرس
            </Link>
          </div>
        ) : null}
      </Reveal>
    </div>
  );
}
