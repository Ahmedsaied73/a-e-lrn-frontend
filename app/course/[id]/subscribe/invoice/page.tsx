'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Link from "next/link";
import { ChevronDown, ChevronUp, Play, Check, CheckCircle, Award, Clock, ArrowLeft, Shield, CreditCard } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchQuizzesByCourse, 
  selectQuizzes, 
  fetchVideoProgress, 
  fetchQuizStatus,
  selectVideoProgress,
  selectQuizStatus
} from '@/store/slices/quizSlice';
import {
  fetchAssignmentsByVideo,
  fetchAssignmentStatus,
  selectAssignments,
  fetchAssignmentsByCourse
} from '@/store/slices/assignmentSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function Page({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [openVideoIds, setOpenVideoIds] = useState<Record<string, boolean>>({});
  
  // Get quizzes from Redux store
  const quizzes = useAppSelector(selectQuizzes);
  
  // Get all video progress and quiz statuses
  const videoProgressMap = useAppSelector(state => state.quiz.videoProgressMap);
  const quizStatusMap = useAppSelector(state => state.quiz.quizStatuses);
  
  // Get assignments from Redux store
  const assignments = useAppSelector(selectAssignments);
  const assignmentStatusMap = useAppSelector(state => state.assignment.assignmentStatuses);

  // Function to toggle a specific video dropdown
  const toggleVideo = (videoId: string) => {
    setOpenVideoIds(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
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

  // Helper function to find a quiz for a specific video
  const findQuizForVideo = useCallback((videoId: number | string) => {
    const videoIdNum = typeof videoId === 'string' ? parseInt(videoId, 10) : videoId;
    return quizzes.find(quiz => quiz.videoId === videoIdNum) || null;
  }, [quizzes]);
  
  // Helper function to find assignments for a specific video
  const findAssignmentsForVideo = useCallback((videoId: number | string) => {
    const videoIdNum = typeof videoId === 'string' ? parseInt(videoId, 10) : videoId;
    return assignments.filter(assignment => assignment.videoId === videoIdNum);
  }, [assignments]);

  // Helper function to get assignment status
  const getAssignmentStatus = useCallback((assignmentId: number) => {
    return assignmentStatusMap[assignmentId] || { taken: false, passed: false, score: 0 };
  }, [assignmentStatusMap]);

  // Helper function to get video progress
  const getVideoProgress = useCallback((videoId: string | number) => {
    return videoProgressMap[videoId] || { completed: false, watchedAt: null };
  }, [videoProgressMap]);

  // Helper function to get quiz status
  const getQuizStatus = useCallback((quizId: number) => {
    return quizStatusMap[quizId] || { taken: false, passed: false, score: 0 };
  }, [quizStatusMap]);

  useEffect(() => {
    // Get userId from localStorage
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }

    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          setError('لم يتم العثور على رمز المصادقة');
          return;
        }

        // Fetch course data
        const response = await fetch(`http://localhost:3005/courses/${params.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCourseData(data);
          
          // Initialize all videos as closed
          const initialOpenState: Record<string, boolean> = {};
          data.videos?.forEach((video: any) => {
            initialOpenState[video.id] = false;
          });
          setOpenVideoIds(initialOpenState);
          
          // Fetch all assignments for the course using the new endpoint
          try {
            const assignmentResponse = await fetch(`http://localhost:3005/assignments/course/${params.id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`,
              },
            });

            if (assignmentResponse.ok) {
              const assignmentData = await assignmentResponse.json();
              // The response contains { course: {...}, assignments: [...] }
              if (assignmentData.assignments && Array.isArray(assignmentData.assignments)) {
                // Log the fetched assignments for debugging
                console.log('Fetched course assignments:', assignmentData);
                // Note: You may need to create a new Redux action to handle this response format
                // For now, we'll use the existing action with the assignments array
                // dispatch(setAssignments(assignmentData.assignments));
              }
            } else {
              console.error('Failed to fetch course assignments:', assignmentResponse.statusText);
              toast.error('فشل في تحميل الواجبات');
            }
          } catch (assignmentError) {
            console.error('Error fetching course assignments:', assignmentError);
            toast.error('حدث خطأ أثناء تحميل الواجبات');
          }
        }
        
        // Check enrollment status
        if (storedUserId) {
          const enrollmentResponse = await fetch(`http://localhost:3005/enroll/api/check-enrollment?userId=${storedUserId}&courseId=${params.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshToken}`,
            },
          });
          
          if (enrollmentResponse.ok) {
            const enrollmentData = await enrollmentResponse.json();
            setIsEnrolled(enrollmentData.isEnrolled);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('حدث خطأ أثناء تحميل بيانات الكورس');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
    
    // Fetch quizzes for this course
    dispatch(fetchQuizzesByCourse(params.id));
  }, [params.id, dispatch, router]);

  const handleSubscription = async () => {
    if (!userId) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }

    if (isEnrolled) {
      toast.success('أنت مشترك بالفعل في هذا الكورس');
      router.push(`/course/${params.id}`);
      return;
    }

    setEnrollmentLoading(true);
    try {
      const response = await fetch('http://localhost:3005/enroll/api/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('refreshToken')}`
        },
        body: JSON.stringify({
          userId: userId,
          courseId: params.id,
          isPaid: true
        })
      });
      
      if (response.ok) {
        setIsEnrolled(true);
        toast.success('تم الاشتراك في الكورس بنجاح! جاري التوجيه...');
        // Redirect to course page after successful enrollment
        setTimeout(() => {
          router.push(`/course/${params.id}`);
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'حدث خطأ أثناء الاشتراك في الكورس');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الاشتراك في الكورس');
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
          href={`/course/${params.id}`}
          className="inline-flex items-center gap-2 text-[#61B846] hover:text-[#61B846]/80 transition-colors"
        >
          <ArrowLeft size={20} />
          العودة إلى صفحة الكورس
        </Link>
      </div>

      {/* Invoice Card - Full Width at Top */}
      <div className="w-full mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">ملخص الطلب</h2>
          
          {/* Course Summary */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">{courseData.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {courseData.description_short || "الدورة لطلبة الأزهر فقط ❤️"}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex justify-between">
                <span>عدد المحاضرات:</span>
                <span>{courseData.videos?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>عدد الامتحانات:</span>
                <span>{quizzes.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>عدد الواجبات:</span>
                <span>{assignments.length || 0}</span>
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
                <span className="text-2xl font-bold text-[#61B846]">
                  {courseData.price === 0 ? "مجاني" : `${courseData.price} جنيه`}
                </span>
              </div>
              {courseData.price > 0 && (
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <span>الضرائب: متضمنة</span>
                  <span>رسوم المعالجة: مجانية</span>
                </div>
              )}
            </div>
            
            {/* Payment Security */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Shield size={16} />
                <span>دفع آمن ومشفر</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CreditCard size={16} />
                <span>جميع طرق الدفع مقبولة</span>
              </div>
            </div>
          </div>
          
          {/* Subscribe Button */}
          <Button 
            className="w-full bg-[#61B846] hover:bg-[#61B846]/90 text-white py-3 text-lg font-semibold"
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
          <div className="bg-gradient-to-l from-[#61B846] to-[#61B846]/80 rounded-lg p-6 mb-8">
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
                    امتحانات {quizzes.length || 0} +
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
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <h2 className="text-xl font-bold p-6 border-b dark:border-gray-700">محتوى الكورس</h2>
            <div className="divide-y dark:divide-gray-700">
              {courseData.videos && courseData.videos.length > 0 ? (
                courseData.videos.map((video: any, index: number) => {
                  // Find the quiz for this video
                  const quiz = findQuizForVideo(video.id);
                  
                  return (
                    <div key={video.id} className="transition-colors">
                      <div 
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => toggleVideo(video.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xl">
                              {openVideoIds[video.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </span>
                            <h3 className="text-lg font-semibold">المحاضرة {getArabicOrdinal(index)}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {video.title}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {openVideoIds[video.id] && (
                        <div className="px-6 pb-6">
                          <div className="space-y-4 pl-10">
                            {/* Video Card */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-[#61B846]">
                              <div className="flex items-center gap-2">
                                <Play size={16} className="text-[#61B846]" />
                                <span className="font-medium">{video.description || "شاهد هذه المحاضرة"}</span>
                              </div>
                              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                                متاح بعد الاشتراك
                              </span>
                            </div>
                            
                            {/* Quiz Card - if there's a quiz for this video */}
                            {quiz && (
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-gray-400">
                                <div className="flex items-center gap-2">
                                  <Award size={16} className="text-gray-500" />
                                  <span className="font-medium">{quiz.title}</span>
                                </div>
                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                                  متاح بعد الاشتراك
                                </span>
                              </div>
                            )}
                            
                            {/* Assignment Cards - if there are assignments for this video */}
                            {findAssignmentsForVideo(video.id).map(assignment => {
                              const isPastDue = new Date(assignment.dueDate) < new Date();
                              
                              return (
                                <div 
                                  key={assignment.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-400 mt-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-blue-400" />
                                    <span className="font-medium">{assignment.title}</span>
                                    
                                    <span className="text-xs text-blue-500">
                                      موعد التسليم: {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
                                    </span>
                                  </div>
                                  
                                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                                    متاح بعد الاشتراك
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-gray-500">
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