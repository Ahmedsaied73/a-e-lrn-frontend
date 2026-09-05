import ExemptionResetPanel from "@/components/admin/quiz/ExemptionResetPanel";

export default function AdminQuizAccessPage({ params }: { params: { videoId: string } }) {
  return <main className="mx-auto max-w-5xl px-4 py-8"><ExemptionResetPanel videoId={params.videoId} /></main>;
}
