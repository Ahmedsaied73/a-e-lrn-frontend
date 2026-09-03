import type { Metadata } from "next";
import QuizIntroCard from "@/components/quiz/QuizIntroCard";

export const metadata: Metadata = {
  title: "بدء الاختبار | منصة التعلم الإلكتروني",
  description: "صفحة بدء اختبار المحاضرة",
};

interface PageProps {
  params: { id: string; video: string };
}

export default function QuizIntroPage({ params }: PageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14" dir="rtl">
      <QuizIntroCard videoId={params.video} courseId={params.id} />
    </div>
  );
}
