'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { checkEnrollmentStatus, enrollInCourse } from '@/services/courseService';

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

export function EnrollmentCard({
  courseId,
  userId,
  isEnrolled,
  courseTitle,
  coursePrice,
  courseDuration,
  questionsCount,
  className,
}: EnrollmentCardProps) {
  const router = useRouter();
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(isEnrolled);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!courseId) return;
      try {
        const result = await checkEnrollmentStatus(courseId);
        setEnrolled(result.enrolled);
      } catch (error) {
        console.error('Error checking enrollment status:', error);
      }
    };
    fetchStatus();
  }, [courseId]);

  /**
   * Handles the enrollment process when the user clicks the enrollment button
   */
  const handleEnrollment = async () => {
    if (enrolled) {
      toast.success('أنت مشترك بالفعل في هذا الكورس');
      return;
    }

    // Redirect to invoice page for subscription
    router.push(`/course/${courseId}/subscribe/invoice`);
  };

  /**
   * Enrolls a user in a course using centralized courseService
   */
  const enrollUserInCourse = async (targetCourseId: string) => {
    return await enrollInCourse(targetCourseId);
  };

  return (
    <div className={cn('rounded-lg border border-gray-200 overflow-hidden shadow-sm', className)}>
      <div className="relative">
        <div className="bg-gradient-to-l from-[#61B846] to-[#61B846]/80 p-4 text-white text-center">
          <h3 className="text-xl font-bold mb-1">{courseTitle}</h3>
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="text-lg font-bold">{coursePrice}</span>
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">جنيها</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleEnrollment}
        disabled={enrollmentLoading || enrolled}
        className={cn(
          'w-full font-bold py-3 px-4 transition-colors text-center',
          enrolled 
            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
            : 'bg-[#61B846] text-white hover:bg-[#61B846]/90'
        )}
      >
        {enrollmentLoading ? 'جاري المعالجة...' : enrolled ? 'انت مشترك في الكورس حاليا' : 'اشترك الآن!'}
      </button>

      <div className="p-4 bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">المحتوى</p>
            <p className="text-xl font-bold">{courseDuration}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">إجمالي الأسئلة</p>
            <p className="text-xl font-bold">{questionsCount} سؤال</p>
          </div>
        </div>
      </div>
    </div>
  );
}