import GradingQueue from "@/components/admin/quiz/GradingQueue";

export default function AdminQuizAttemptsPage({ params }: { params: { quizId: string } }) {
  return <main className="mx-auto max-w-7xl px-4 py-8"><GradingQueue quizId={params.quizId} /></main>;
}
