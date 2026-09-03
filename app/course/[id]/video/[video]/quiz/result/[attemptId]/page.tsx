"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store/store";
import { fetchQuizResult, fetchQuizAttempts, selectQuizResult, selectQuizAttempts, selectSubmitResult } from "@/store/slices/quizSlice";
import QuizResultSummary from "@/components/quiz/QuizResultSummary";
import QuizReviewList from "@/components/quiz/QuizReviewList";
import { Loader2 } from "lucide-react";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

interface PageProps {
  params: { id: string; video: string; attemptId: string };
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
          dispatch(fetchQuizAttempts(params.video)).unwrap()
        ]);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "تعذر تحميل النتيجة"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.attemptId, params.video, dispatch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#207bff] mb-4" />
        <p className="text-slate-500 font-medium">جاري تحميل النتيجة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl max-w-md text-center">
          <p className="font-bold mb-4">{error}</p>
          <button
            onClick={() => router.push(`/course/${params.id}/video/${params.video}/quiz`)}
            className="bg-[#207bff] text-white px-4 py-2 rounded-lg text-sm font-bold"
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
    <div className="bg-slate-50 min-h-screen pb-12">
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
          courseId={params.id}
          videoId={params.video}
        />
      ) : (
        <QuizResultSummary
          mode="final"
          result={result}
          courseId={params.id}
          videoId={params.video}
        />
      )}

      {/* 2. Review List (Hidden if pending) */}
      {!isPending && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
          <QuizReviewList
            questions={result.questions}
            attempts={attempts}
          />
        </div>
      )}
    </div>
  );
}
