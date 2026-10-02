"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuizRunner from "@/components/quiz/QuizRunner";
import type { StartQuizData } from "@/types/quiz";
import { AppDispatch } from "@/store/store";
import { selectActiveAttempt, selectSubmitResult, startQuizAttempt } from "@/store/slices/quizSlice";
import { Loader2 } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { withTeacher } from "@/lib/site-config";
import { PAGE_TITLES } from "@/lib/page-titles";

interface PageProps {
  params: { courseSlug: string; videoSlug: string };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export default function QuizRunPage({ params }: PageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const activeAttempt = useSelector(selectActiveAttempt);
  const submitResult = useSelector(selectSubmitResult);
  const [startData, setStartData] = useState<StartQuizData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // If we already loaded/started an attempt on this mount, or if a submission occurred, do not run again
    if (hasLoadedRef.current || submitResult) return;
    hasLoadedRef.current = true;
    let cancelled = false;

    const loadAttempt = async () => {
      setErrorMsg(null);

      const existingAttempt = activeAttempt;
      if (
        existingAttempt &&
        String(existingAttempt.quiz.videoSlug) === String(params.videoSlug) &&
        existingAttempt.status === "IN_PROGRESS"
      ) {
        setStartData(existingAttempt);
        return;
      }

      try {
        const data = await dispatch(startQuizAttempt(params.videoSlug)).unwrap();
        if (!cancelled) setStartData(data);
      } catch (err: unknown) {
        if (!cancelled) setErrorMsg(getErrorMessage(err, "تعذر بدء الاختبار"));
      }
    };

    loadAttempt();
    return () => {
      cancelled = true;
    };
    // activeAttempt and submitResult are intentionally omitted so completing a quiz
    // and clearing activeAttempt does not inadvertently start a new attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, params.videoSlug]);

  if (!startData && !errorMsg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-brand-bg">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
        <p className="font-medium text-brand-muted">جاري تجهيز الاختبار...</p>
      </div>
    );
  }

  if (errorMsg || !startData) {
    return (
      <div className="mx-auto mt-10 flex min-h-[50vh] max-w-2xl items-center justify-center rounded-xl bg-brand-accent/10 p-4 text-brand-accent">
        <p className="font-bold">{errorMsg || "حدث خطأ غير متوقع"}</p>
      </div>
    );
  }

  return (
    <>
      <PageTitle title={withTeacher(PAGE_TITLES.quizRun)} />
      <QuizRunner
        startData={startData}
        courseSlug={params.courseSlug}
        videoSlug={params.videoSlug}
      />
    </>
  );
}
