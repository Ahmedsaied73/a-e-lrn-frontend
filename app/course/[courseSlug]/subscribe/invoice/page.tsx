'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Link from "next/link";
import { ChevronDown, ChevronUp, Play, ArrowLeft, Shield, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { fetchCourseBySlug, checkEnrollmentStatus, enrollInCourse } from '@/services/courseService';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function Page({ params }: { params: { courseSlug: string } }) {
  const router = useRouter();
  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [openVideoSlugs, setOpenVideoSlugs] = useState<Record<string, boolean>>({});

  // Function to toggle a specific video dropdown
  const toggleVideo = (videoSlug: string) => {
    setOpenVideoSlugs(prev => ({
      ...prev,
      [videoSlug]: !prev[videoSlug]
    }));
  };

  // Function to get Arabic ordinal number (first, second, etc.)
  const getArabicOrdinal = (index: number) => {
    const arabicOrdinals = [
      'الأولى',
      'الثانية',
      'الثالثة',
      'الرابعة',
      'الخامسة',
      'السادسة',
      'السابعة',
      'الثامنة',
      'التاسعة',
      'العاشرة',
      'الحادية عشر',
      'الثانية عشر',
      'الثالثة عشر',
      'الرابعة عشر',
      'الخامسة عشر',
      'السادسة عشر',
      'السابعة عشر',
      'الثامنة عشر',
      'التاسعة عشر',
      'العشرون'
    ];
    
    return index < arabicOrdinals.length 
      ? arabicOrdinals[index] 
      : `${index + 1}`;
  };

  // Helper function to find assignments for a specific video
  // (legacy assignments are dormant — never matched against Bunny videos)
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setIsLoading(true);

        // Fetch course data
        const data = await fetchCourseBySlug(params.courseSlug);
        setCourseData(data);
        
        // Initialize all videos as closed
        const initialOpenState: Record<string, boolean> = {};
        data.videos?.forEach((video: any) => {
          initialOpenState[video.slug] = false;
        });
        setOpenVideoSlugs(initialOpenState);
        
        // Check enrollment status
        try {
          const status = await checkEnrollmentStatus(params.courseSlug);
          setIsEnrolled(status.enrolled);
        } catch (enrollErr) {
          console.error('Error checking enrollment status:', enrollErr);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('حدث خطأ أثناء تحميل بيانات الكورس');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [params.courseSlug, router]);

  const handleSubscription = async () => {
    if (isEnrolled) {
      toast.success('أنت مشترك بالفعل في هذا الكورس');
      router.push(`/course/${params.courseSlug}`);
      return;
    }

    setEnrollmentLoading(true);
    try {
      await enrollInCourse(params.courseSlug);
      setIsEnrolled(true);
      toast.success('تم الاشتراك في الكورس بنجاح! جاري التوجيه...');
      setTimeout(() => {
        router.push(`/course/${params.courseSlug}`);
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الاشتراك في الكورس');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (isLoading) return <div className="text-center p-8">جاري التحميل...</div>;
  if (error) return <div className="text-center p-8 text-red-500">خطأ: {error}</div>;
  if (!courseData) return <div className="text-center p-8">لا توجد بيانات متاحة للكورس</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link 
          href={`/course/${params.courseSlug}`}
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-600/80 transition-colors"
        >
          <ArrowLeft size={20} />
          العودة إلى صفحة الكورس
        </Link>
      </div>

      {/* Invoice Card - Full Width at Top */}
      <div className="w-full mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">ملخص الطلب</h2>
          
          {/* Course Summary */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">{courseData.title}</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              {courseData.description_short || "الدورة لطلبة الأزهر فقط ❤️"}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex justify-between">
                <span>عدد المحاضرات:</span>
                <span>{courseData.videos?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>عدد الامتحانات:</span>
                <span>{courseData.exams_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>عدد الملفات:</span>
                <span>{courseData.files_count || 0}</span>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Price Details */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold">السعر:</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {courseData.price === 0 ? "مجاني" : `${courseData.price} جنيه`}
                </span>
              </div>
              {courseData.price > 0 && (
                <div className="flex gap-4 text-sm text-on-surface-variant mt-2">
                  <span>الضرائب: متضمنة</span>
                  <span>رسوم المعالجة: مجانية</span>
                </div>
              )}
            </div>
            
            {/* Payment Security */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                <Shield size={16} />
                <span>دفع آمن ومشفر</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <CreditCard size={16} />
                <span>جميع طرق الدفع مقبولة</span>
              </div>
            </div>
          </div>
          
          {/* Subscribe Button */}
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
            disabled={enrollmentLoading}
            onClick={handleSubscription}
          >
            {enrollmentLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري المعالجة...
              </div>
            ) : (
              courseData.price === 0 ? "انضم للكورس مجاناً" : "اشترك الآن"
            )}
          </Button>
        </div>
      </div>

      {/* Course Content Section - Copy from main page */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content - Left Side */}
        <div className="flex-1">
          {/* Course Header */}
          <div className="bg-linear-to-l from-primary-color to-primary-light rounded-lg p-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  {courseData.title || "كورس الأزهر المكثف المجاني"}
                </h1>
                <div className="flex gap-4 mb-4">
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    ملفات {courseData.files_count || 0} +
                  </span>
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    فيديوهات {courseData.videos?.length || 0} +
                  </span>
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    امتحانات {courseData.exams_count || 0} +
                  </span>
                </div>
              </div>
              <div className="text-white text-center">
                <p className="text-lg font-bold">{courseData.price === 0 ? "هذا الكورس مجاني !" : `السعر: ${courseData.price} جنيه`}</p>
                <p className="text-sm">{courseData.description_short || "الدورة لطلبة الأزهر فقط ❤️"}</p>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="bg-white rounded-lg overflow-hidden">
            <h2 className="text-xl font-bold p-6 border-b border-outline-variant">محتوى الكورس</h2>
            <div className="divide-y divide-outline-variant">
              {courseData.videos && courseData.videos.length > 0 ? (
                courseData.videos.map((video: any, index: number) => {
                  return (
                    <div key={video.slug} className="transition-colors">
                      <div 
                        className="p-6 hover:bg-surface-container-low transition-colors cursor-pointer"
                        onClick={() => toggleVideo(video.slug)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xl">
                              {openVideoSlugs[video.slug] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </span>
                            <h3 className="text-lg font-semibold">المحاضرة {getArabicOrdinal(index)}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-on-surface-variant">
                              {video.title}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {openVideoSlugs[video.slug] && (
                        <div className="px-6 pb-6">
                          <div className="space-y-4 pl-10">
                            {/* Video Card */}
                            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border-l-4 border-primary-color">
                              <div className="flex items-center gap-2">
                                <Play size={16} className="text-emerald-600" />
                                <span className="font-medium">{video.description || "شاهد هذه المحاضرة"}</span>
                              </div>
                              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                                متاح بعد الاشتراك
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-on-surface-variant">
                  لا توجد محاضرات متاحة حالياً
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
