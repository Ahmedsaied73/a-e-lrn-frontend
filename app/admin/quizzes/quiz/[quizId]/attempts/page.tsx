import GradingQueue from "@/components/admin/quiz/GradingQueue";

export default function AdminQuizAttemptsPage({ params }: { params: { quizId: string } }) {
  return <main className="mx-auto max-w-7xl p-6 lg:p-8"><GradingQueue quizId={params.quizId} /></main>;
}
