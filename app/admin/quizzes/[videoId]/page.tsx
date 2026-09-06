import QuizAuthoringForm from "@/components/admin/quiz/QuizAuthoringForm";

export default function AdminQuizAuthoringPage({ params }: { params: { videoId: string } }) {
  return <main className="mx-auto max-w-5xl p-6 lg:p-8"><QuizAuthoringForm videoId={params.videoId} /></main>;
}
