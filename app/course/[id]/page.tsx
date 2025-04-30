'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { EnrollmentCard } from '@/components/enrollment-card';
import Link from "next/link";

export default function Page({ params }: { params: { id: string } }) {
  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  useEffect(() => {
    // Get userId from localStorage, either directly or from the stored userData object
    const userDataStr = localStorage.getItem('userData');
    let userId = localStorage.getItem('userId');
    
    // If userData exists as JSON string, try to extract userId from it
    if (userDataStr && !userId) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.id) {
          userId = userData.id.toString();
        }
      } catch (error) {
        console.error('Error parsing userData from localStorage:', error);
      }
    }
    
    setUserId(userId);

    const fetchCourseData = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3005/courses/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch course data');
        }

        const data = await response.json();
        console.log(data);
        setCourseData(data);
        
        // Check if user is already enrolled in this course
        if (userId) {
          try {
            const enrollmentResponse = await fetch('http://localhost:3005/enroll/api/enrollment-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`
              },
              body: JSON.stringify({ userId, courseId: params.id })
            });
            if (enrollmentResponse.ok) {
              const enrollmentData = await enrollmentResponse.json();
              setIsEnrolled(!!enrollmentData.enrolled);
            }
          } catch (enrollErr) {
            console.error('Error checking enrollment status:', enrollErr);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [params.id]);

  if (isLoading) return <div className="text-center p-8">جاري التحميل...</div>;
  if (error) return <div className="text-center p-8 text-red-500">خطأ: {error}</div>;
  if (!courseData) return <div className="text-center p-8">لا توجد بيانات متاحة للكورس</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content - Left Side */}
        <div className="flex-1">
          {/* Course Header */}
          <div className="bg-gradient-to-l from-[#61B846] to-[#61B846]/80 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  كورس الأزهر المكثف المجاني (الصف الاول الثانوي)
                </h1>
                <div className="flex gap-4 mb-4">
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    ملفات {courseData.files_count || 0} +
                  </span>
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    فيديوهات {courseData.videos_count || 9} +
                  </span>
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    امتحانات {courseData.exams_count || 0} +
                  </span>
                </div>
              </div>
              <div className="text-white text-center">
                <p className="text-lg font-bold">هذا الكورس مجاني !</p>
                <p className="text-sm">الدورة لطلبة الأزهر فقط ❤️</p>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <h2 className="text-xl font-bold p-6 border-b dark:border-gray-700">محتوى الكورس</h2>
        <div className="divide-y dark:divide-gray-700">
          <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xl">▼</span>
                <h3 className="text-lg font-semibold">المحاضرات الباقية من المنهج</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">المفروض تسمعها اليوم دول عشان تبدأ المراجعة الي تحت دي ❤️</span>
              </div>
            </div>
          </div>
          <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xl">▼</span>
                <h3 className="text-lg font-semibold">المراجعة النهائية (شرح المنهج)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">المراجعة النهائية (شرح المنهج) كامل</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Section */}
      {isEnrolled && courseData?.videos?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">الفيديوهات المتاحة</h2>
          <div className="space-y-4">
            {courseData.videos.map((video: any) => (
              <div key={video.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium">{video.title}</span>
                <Link
                  href={`/course/${params.id}/video/${video.id}`}
                  className="text-[#61B846] hover:underline"
                >
                  شاهد المحاضرة من هنا
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
        
        {/* Enrollment Card - Right Side */}
        <div className="md:w-80 lg:w-96 shrink-0">
          <EnrollmentCard
            courseId={params.id}
            userId={userId}
            isEnrolled={isEnrolled}
            courseTitle={courseData.title || "كورس الأزهر المكثف المجاني"}
            coursePrice={courseData.price || "مجاني"}
            courseDuration={courseData.duration || "10"}
            questionsCount={courseData.questions_count || "50"}
            className="sticky top-24"
          />
        </div>
      </div>
    </div>
  );
}
  