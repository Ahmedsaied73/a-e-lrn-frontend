import ExemptionResetPanel from "@/components/admin/quiz/ExemptionResetPanel";

export default function AdminQuizAccessPage({ params }: { params: { videoId: string } }) {
  return <main className="mx-auto max-w-5xl p-6 lg:p-8"><ExemptionResetPanel videoId={params.videoId} /></main>;
}
