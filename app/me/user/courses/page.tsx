'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowLeft, Clock, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { CourseListItem } from '@/services/courseService';

export default function UserCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const data = await apiClient.get<CourseListItem[]>('/courses/enrolled');
        setCourses(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('خطأ في جلب الكورسات المسجلة:', err);
        setError(err.message || 'حدث خطأ أثناء جلب الكورسات المسجلة');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  return (
    <div className="account-page">
      {/* Header with courses icon */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="bg-blue-500 rounded-full p-3 mb-2">
          <BookOpen className="text-white h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">كورساتي</h1>
      </div>

      {/* Back to profile button */}
      <div className="mb-6">
        <Link href="/me/user">
          <Button variant="outline" className="text-white border-[#1f2937] bg-[#111827] hover:bg-[#1f2937]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة إلى ملف المستخدم
          </Button>
        </Link>
      </div>

      {/* Courses list */}
      <Card className="bg-[#111827] border-[#1f2937] text-white">
        <CardHeader>
          <CardTitle className="text-center">
            <span className="text-blue-400">★</span> الكورسات المسجلة <span className="text-blue-400">★</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">
              <p className="text-xl">جاري تحميل الكورسات...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-xl text-red-400">حدث خطأ</p>
              <p className="text-gray-400 mt-2">{error}</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link href={`/course/${course.id}`} key={course.id}>
                  <div className="bg-[#1f2937] rounded-lg p-4 h-full hover:bg-[#2d3748] transition-colors cursor-pointer">
                    <div className="relative w-full h-40 mb-4 overflow-hidden rounded-md group">
                      <Image 
                        src={course.thumbnail || '/placeholder.jpg'} 
                        alt={course.title || 'Course'} 
                        fill 
                        className="object-cover transition-transform group-hover:scale-105" 
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-blue-400 line-clamp-1">{course.title}</h3>
                    <p className="text-gray-300 mb-3 line-clamp-2 h-12">{course.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center text-gray-400">
                        <Clock className="h-4 w-4 ml-1" />
                        <span>{course.price && course.price > 0 ? `${course.price} ج.م` : 'مجاني'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-gray-400">
                          <BookOpenCheck className="h-4 w-4 ml-1" />
                          <span className="text-sm">{course.grade}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xl">لا يوجد كورسات مسجلة حالياً</p>
              <p className="text-gray-400 mt-2">يمكنك التسجيل في الكورسات من صفحة الكورسات الرئيسية</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
