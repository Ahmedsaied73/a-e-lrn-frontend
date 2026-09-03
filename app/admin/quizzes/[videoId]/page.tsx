import QuizAuthoringForm from "@/components/admin/quiz/QuizAuthoringForm";

export default function AdminQuizAuthoringPage({ params }: { params: { videoId: string } }) {
  return <main className="mx-auto max-w-5xl px-4 py-8"><QuizAuthoringForm videoId={params.videoId} /></main>;
}
