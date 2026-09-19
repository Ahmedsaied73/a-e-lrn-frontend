import type { Metadata } from "next";
import QuizIntroCard from "@/components/quiz/QuizIntroCard";

export const metadata: Metadata = {
  // Unique title only — the root layout template appends `| ${teacherName}`.
  title: "بدء الاختبار",
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
