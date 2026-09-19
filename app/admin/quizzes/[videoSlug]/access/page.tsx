import type { Metadata } from "next";
import ExemptionResetPanel from "@/components/admin/quiz/ExemptionResetPanel";

export const metadata: Metadata = {
  title: "إدارة وصول الاختبار",
};

export default function AdminQuizAccessPage({ params }: { params: { videoSlug: string } }) {
  return <main className="mx-auto max-w-5xl p-6 lg:p-8"><ExemptionResetPanel videoSlug={params.videoSlug} /></main>;
}