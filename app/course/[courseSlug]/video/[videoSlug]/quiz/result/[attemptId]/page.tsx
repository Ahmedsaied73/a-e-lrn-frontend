"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store/store";
import { fetchQuizResult, fetchQuizAttempts, selectQuizResult, selectQuizAttempts, selectSubmitResult } from "@/store/slices/quizSlice";
import QuizResultSummary from "@/components/quiz/QuizResultSummary";
import QuizReviewList from "@/components/quiz/QuizReviewList";
import { Loader2 } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { withTeacher } from "@/lib/site-config";
import { PAGE_TITLES } from "@/lib/page-titles";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

interface PageProps {
  params: { courseSlug: string; videoSlug: string; attemptId: string };
}

export default function QuizResultPage({ params }: PageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const result = useSelector(selectQuizResult);
  const attempts = useSelector(selectQuizAttempts);
  const submitResult = useSelector(selectSubmitResult); // from fresh submission if any

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          dispatch(fetchQuizResult(params.attemptId)).unwrap(),
          dispatch(fetchQuizAttempts(params.videoSlug)).unwrap()
        ]);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "تعذر تحميل النتيجة"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.attemptId, params.videoSlug, dispatch]);

  // Auto-refetch while grading: reflects the real backend state (AI worker or
  // human grader flips GRADING → GRADED). Polls every 10s, max ~2 minutes,
  // then stops and leaves manual refresh. No fake delays.
  // F-2: SUBMITTED counts as pending too (matches isPending below).
  const resultStatus = result?.status;
  useEffect(() => {
    if (isLoading || (resultStatus !== "GRADING" && resultStatus !== "SUBMITTED")) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tries > 12) {
        clearInterval(timer);
        return;
      }
      void dispatch(fetchQuizResult(params.attemptId)).unwrap().catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, [isLoading, resultStatus, params.attemptId, dispatch]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-brand-bg">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand-primary" />
        <p className="font-medium text-brand-muted">جاري تحميل النتيجة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-brand-bg">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-brand-accent">
          <p className="mb-4 font-bold">{error}</p>
          <button
            onClick={() => router.push(`/course/${params.courseSlug}/video/${params.videoSlug}/quiz`)}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white"
          >
            العودة للاختبار
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isPending = result.status === "SUBMITTED" || result.status === "GRADING";

  return (
    <div className="min-h-screen bg-brand-bg pb-12">
      <PageTitle title={withTeacher(PAGE_TITLES.quizResult)} />
      {/* 1. Summary Card */}
      {isPending ? (
        <QuizResultSummary
          mode="pending"
          submitResult={submitResult || {
            attemptId: result.attemptId,
            status: "GRADING",
            earnedPoints: result.earnedPoints,
            totalPoints: result.totalPoints,
            scorePercent: result.scorePercent,
            hasEssays: result.questions.some(q => q.type === "comment"),
            perQuestion: []
          }}
          attemptId={result.attemptId}
          courseSlug={params.courseSlug}
          videoSlug={params.videoSlug}
        />
      ) : (
        <QuizResultSummary
          mode="final"
          result={result}
          courseSlug={params.courseSlug}
          videoSlug={params.videoSlug}
        />
      )}

      {/* 2. Review List (Hidden if pending) */}
      {!isPending && (
        <div id="quiz-review" className="mx-auto mt-8 max-w-4xl scroll-mt-24 px-4 sm:px-6">
          <QuizReviewList
            questions={result.questions}
            attempts={attempts}
          />
        </div>
      )}
    </div>
  );
}
