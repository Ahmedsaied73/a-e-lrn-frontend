'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CircleHelp, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { checkEnrollmentStatus } from '@/services/courseService';

interface EnrollmentCardProps {
  courseId: string;
  userId?: string | null;
  isEnrolled: boolean;
  courseTitle: string;
  coursePrice: string | number;
  courseDuration: string | number;
  questionsCount: string | number;
  className?: string;
}

export function EnrollmentCard({ courseId, isEnrolled, courseTitle, coursePrice, courseDuration, questionsCount, className }: EnrollmentCardProps) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(isEnrolled);

  useEffect(() => {
    checkEnrollmentStatus(courseId).then((result) => setEnrolled(result.enrolled)).catch(() => undefined);
  }, [courseId]);

  const handleEnrollment = () => {
    if (enrolled) return toast.success('أنت مشترك بالفعل في هذا الكورس');
    router.push(`/course/${courseId}/subscribe/invoice`);
  };

  return <aside className={cn('overflow-hidden rounded-lg bg-white shadow-level-2', className)}>
    <div className="border-b border-outline-variant/60 p-5">
      <p className="text-caption font-semibold text-secondary-color">ملخص الدورة</p>
      <h2 className="mt-2 text-lg font-bold leading-7 text-on-surface">{courseTitle}</h2>
      <div className="mt-4 flex items-baseline gap-2 text-primary"><span className="text-2xl font-bold">{coursePrice}</span><span className="text-sm font-semibold">جنيه</span></div>
    </div>
    <button onClick={handleEnrollment} disabled={enrolled} className={cn('m-5 flex w-[calc(100%-2.5rem)] items-center justify-center rounded-md px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2', enrolled ? 'bg-[#e8f2ff] text-primary' : 'bg-primary text-white hover:bg-[#0057c0]')}>
      {enrolled ? 'أنت مشترك في الكورس حالياً' : 'اشترك في الدورة'}
    </button>
    <div className="grid grid-cols-2 border-t border-outline-variant/60 bg-surface-container-low">
      <div className="border-l border-outline-variant/60 p-4 text-center"><Clock className="mx-auto mb-2 h-4 w-4 text-secondary-color" /><p className="text-caption text-on-surface-variant">المدة</p><p className="mt-1 text-sm font-bold text-on-surface">{courseDuration}</p></div>
      <div className="p-4 text-center"><CircleHelp className="mx-auto mb-2 h-4 w-4 text-secondary-color" /><p className="text-caption text-on-surface-variant">الأسئلة</p><p className="mt-1 text-sm font-bold text-on-surface">{questionsCount} سؤال</p></div>
    </div>
  </aside>;
}
