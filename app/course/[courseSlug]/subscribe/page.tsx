import { redirect } from 'next/navigation';

export default function SubscribePage({ params }: { params: { courseSlug: string } }) {
  redirect(`/course/${params.courseSlug}/subscribe/invoice`);
}
