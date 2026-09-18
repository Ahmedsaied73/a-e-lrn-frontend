import type { Metadata } from "next";
import QuizIntroCard from "@/components/quiz/QuizIntroCard";

export const metadata: Metadata = {
  title: "بدء الاختبار | منصة التعلم الإلكتروني",
  description: "صفحة بدء اختبار المحاضرة",
};

interface PageProps {
  params: { courseSlug: string; videoSlug: string };
}

export default function QuizIntroPage({ params }: PageProps) {
  return (
    <div dir="rtl">
      <QuizIntroCard videoSlug={params.videoSlug} courseSlug={params.courseSlug} />
    </div>
  );
}
