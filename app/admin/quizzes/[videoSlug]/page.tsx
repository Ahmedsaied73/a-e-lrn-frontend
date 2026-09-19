import type { Metadata } from "next";
import QuizAuthoringForm from "@/components/admin/quiz/QuizAuthoringForm";

export const metadata: Metadata = {
  title: "تحرير الاختبار",
};

export default function AdminQuizAuthoringPage({ params }: { params: { videoSlug: string } }) {
  return <main className="mx-auto max-w-5xl p-6 lg:p-8"><QuizAuthoringForm videoSlug={params.videoSlug} /></main>;
}