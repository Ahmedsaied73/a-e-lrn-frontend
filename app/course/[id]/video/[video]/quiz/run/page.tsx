"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuizRunner from "@/components/quiz/QuizRunner";
import type { StartQuizData } from "@/types/quiz";
import { AppDispatch } from "@/store/store";
import { selectActiveAttempt, startQuizAttempt } from "@/store/slices/quizSlice";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: { id: string; video: string };
}

export default function QuizRunPage({ params }: PageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const activeAttempt = useSelector(selectActiveAttempt);
  const [startData, setStartData] = useState<StartQuizData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAttempt = async () => {
      setErrorMsg(null);

      const existingAttempt = activeAttempt;
      if (existingAttempt && String(existingAttempt.quiz.videoId) === String(params.video)) {
        setStartData(existingAttempt);
        return;
      }

      try {
        const data = await dispatch(startQuizAttempt(params.video)).unwrap();
        if (!cancelled) setStartData(data);
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err?.message || "تعذر بدء الاختبار");
      }
    };

    loadAttempt();
    return () => {
      cancelled = true;
    };
  }, [activeAttempt, dispatch, params.video]);

  if (!startData && !errorMsg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#207bff]" />
        <p className="font-medium text-slate-500">جاري تجهيز الاختبار...</p>
      </div>
    );
  }

  if (errorMsg || !startData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-rose-600 bg-rose-50 p-4 rounded-xl max-w-2xl mx-auto mt-10">
        <p className="font-bold">{errorMsg || "حدث خطأ غير متوقع"}</p>
      </div>
    );
  }

  return (
    <QuizRunner
      startData={startData}
      courseId={params.id}
      videoId={params.video}
    />
  );
}
