import { redirect } from 'next/navigation';

export default function SubscribePage({ params }: { params: { id: string } }) {
  redirect(`/course/${params.id}/subscribe/invoice`);
}
