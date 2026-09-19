import type { Metadata } from "next";
import GradingQueue from "@/components/admin/quiz/GradingQueue";

export const metadata: Metadata = {
  title: "محاولات الاختبار",
};

export default function AdminQuizAttemptsPage({ params }: { params: { quizSlug: string } }) {
  return <main className="mx-auto max-w-7xl p-6 lg:p-8"><GradingQueue quizSlug={params.quizSlug} /></main>;
}