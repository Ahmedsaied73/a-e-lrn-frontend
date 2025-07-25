'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { EnrollmentCard } from '@/components/enrollment-card';
import Link from "next/link";
import { ChevronDown, ChevronUp, Play, Check, CheckCircle, Award, Clock } from 'lucide-react';
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
  fetchAssignmentsByCourse // Added import
} from '@/store/slices/assignmentSlice';

export default function Page({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [openVideoIds, setOpenVideoIds] = useState<Record<string, boolean>>({});
  const [courseDuration, setCourseDuration] = useState<string>('0');
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  
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

  // Helper function to format duration from seconds
  const formatDuration = useCallback((totalSeconds: number) => {
    if (totalSeconds === 0) return '0 دقيقة';
    const totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
      return `${totalMinutes} دقيقة`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (minutes === 0) {
        return `${hours} ساعة`;
      } else {
        return `${hours} ساعة و ${minutes} دقيقة`;
      }
    }
  }, []);

  // Helper function to calculate total course duration and questions
  const calculateCourseStats = useCallback((courseData: any, quizzes: any[]) => {
    // Calculate total duration from all videos in seconds
    const totalDurationInSeconds = courseData?.videos?.reduce((total: number, video: any) => {
      return total + (video.duration || 0);
    }, 0) || 0;

    // Calculate total questions from all quizzes
    const totalQuestionsCount = quizzes.reduce((total, quiz) => {
      return total + (quiz.questionCount || 0);
    }, 0);
    
    setCourseDuration(formatDuration(totalDurationInSeconds));
    setTotalQuestions(totalQuestionsCount);
  }, [formatDuration]);

  // Check video progress, quiz status, and assignment status when needed
  const checkVideoAndQuizStatus = useCallback(async (videoId: string | number) => {
    // Fetch video progress
    dispatch(fetchVideoProgress(videoId));
    
    // Find if there's a quiz for this video
    const quiz = findQuizForVideo(videoId);
    if (quiz) {
      // Fetch quiz status
      dispatch(fetchQuizStatus(quiz.id));
    }
    
    // Find assignments for this video and fetch their status
    const videoAssignments = findAssignmentsForVideo(videoId);
    if (videoAssignments.length > 0) {
      // Fetch status for each assignment
      // dispatch(fetchAssignmentsByVideo(videoId)); // Removed redundant dispatch
      videoAssignments.forEach(assignment => {
        dispatch(fetchAssignmentStatus(assignment.id));
      });
    }
  }, [dispatch, findQuizForVideo, findAssignmentsForVideo]);

  // Helper function to get video progress
  const getVideoProgress = (videoId: string | number) => {
    return videoProgressMap[videoId] || { completed: false, watchedAt: null };
  };

  // Helper function to get quiz status
  const getQuizStatus = (quizId: number) => {
    return quizStatusMap[quizId] || null;
  };
  
  // Helper function to get assignment status
  const getAssignmentStatus = (assignmentId: number) => {
    return assignmentStatusMap[assignmentId] || null;
  };

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
        setCourseData(data);
        
        // Initialize all videos as closed
        if (data.videos && data.videos.length > 0) {
          const initialOpenState: Record<string, boolean> = {};
          data.videos.forEach((video: any) => {
            initialOpenState[video.id] = false;
          });
          setOpenVideoIds(initialOpenState);
          
          // Fetch all assignments for the course
          dispatch(fetchAssignmentsByCourse({ courseId: params.id, videoIds: data.videos.map((video: any) => video.id) }));
        }
        
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
    
    // Fetch quizzes for this course
    dispatch(fetchQuizzesByCourse(params.id));
  }, [params.id, dispatch]);
  
  // Fetch status for videos when course data is loaded and user is enrolled
  useEffect(() => {
    if (courseData?.videos && courseData.videos.length > 0 && isEnrolled) {
      // Fetch status for each video
      courseData.videos.forEach((video: any) => {
        checkVideoAndQuizStatus(video.id);
      });
    }
  }, [courseData, isEnrolled, checkVideoAndQuizStatus]);

  // Calculate course statistics when course data and quizzes are loaded
  useEffect(() => {
    if (courseData && quizzes.length >= 0) {
      calculateCourseStats(courseData, quizzes);
    }
  }, [courseData, quizzes, calculateCourseStats]);

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
                  // Get video progress using our helper function
                  const videoProgress = getVideoProgress(video.id);
                  
                  // Find the quiz for this video
                  const quiz = findQuizForVideo(video.id);
                  
                  // Get quiz status if there's a quiz
                  const quizStatus = quiz ? getQuizStatus(quiz.id) : null;
                  
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
                            
                            {/* Show video completion status */}
                            {videoProgress.completed && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs">
                                <CheckCircle size={12} className="text-green-600" />
                                <span>تم المشاهدة</span>
                              </span>
                            )}
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
                                <Play size={16} className={`${videoProgress.completed ? "text-green-600" : "text-[#61B846]"}`} />
                                <span className="font-medium">{video.description || "شاهد هذه المحاضرة"}</span>
                                
                                {videoProgress.completed && (
                                  <span className="text-xs text-gray-500">
                                    تمت المشاهدة في {new Date(videoProgress.watchedAt || '').toLocaleDateString('ar-EG')}
                                  </span>
                                )}
                              </div>
                              {isEnrolled && (
                                <Link
                                  href={`/course/${params.id}/video/${video.id}`}
                                  className="text-[#61B846] hover:underline text-sm flex items-center gap-1"
                                >
                                  {videoProgress.completed ? (
                                    <>
                                      <Check size={16} />
                                      مشاهدة مرة أخرى
                                    </>
                                  ) : (
                                    <>
                                      <Play size={16} />
                                      شاهد المحاضرة من هنا
                                    </>
                                  )}
                                </Link>
                              )}
                            </div>
                            
                            {/* Quiz Card - if there's a quiz for this video */}
                            {quiz && (
                              <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 
                                ${quizStatus?.passed 
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-500" 
                                  : quizStatus?.taken 
                                  ? "bg-red-50 dark:bg-red-900/20 border-red-500" 
                                  : "bg-gray-50 dark:bg-gray-700 border-gray-400"}`}
                              >
                                <div className="flex items-center gap-2">
                                  {quizStatus?.passed ? (
                                    <Award size={16} className="text-green-600" />
                                  ) : quizStatus?.taken ? (
                                    <Clock size={16} className="text-red-500" />
                                  ) : (
                                    <Award size={16} className="text-gray-500" />
                                  )}
                                  <span className="font-medium">{quiz.title}</span>
                                  
                                  {quizStatus?.taken && (
                                    <span className={`text-xs ${quizStatus?.passed ? "text-green-500" : "text-red-500"}`}>
                                      {quizStatus?.passed 
                                        ? `نجاح - ${quizStatus.score}%` 
                                        : `رسوب - ${quizStatus.score}%`}
                                    </span>
                                  )}
                                </div>
                                
                                {isEnrolled && videoProgress.completed && (
                                  <Link
                                    href={`/course/${params.id}/video/${video.id}/quiz/${quiz.id}`}
                                    className={`hover:underline text-sm flex items-center gap-1
                                      ${quizStatus?.passed 
                                        ? "text-green-600" 
                                        : quizStatus?.taken 
                                        ? "text-red-500" 
                                        : "text-[#61B846]"}`}
                                  >
                                    {quizStatus?.passed ? (
                                      <>
                                        <Check size={16} />
                                        عرض النتيجة
                                      </>
                                    ) : quizStatus?.taken ? (
                                      <>
                                        <Clock size={16} />
                                        إعادة الاختبار
                                      </>
                                    ) : (
                                      <>
                                        <Award size={16} />
                                        بدء الاختبار
                                      </>
                                    )}
                                  </Link>
                                )}
                              </div>
                            )}
                            
                            {/* Assignment Cards - if there are assignments for this video */}
                            {findAssignmentsForVideo(video.id).map(assignment => {
                              const assignmentStatus = getAssignmentStatus(assignment.id);
                              const isPastDue = new Date(assignment.dueDate) < new Date();
                              const isSubmitted = assignment.hasSubmitted;
                              const isGraded = assignment.submission?.status === "GRADED";
                              
                              return (
                                <div 
                                  key={assignment.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border-l-4 mt-2
                                    ${isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore
                                      ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                                      : isGraded
                                      ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                                      : isSubmitted
                                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500"
                                      : isPastDue
                                      ? "bg-gray-50 dark:bg-gray-700 border-red-400"
                                      : "bg-gray-50 dark:bg-gray-700 border-blue-400"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore ? (
                                      <CheckCircle size={16} className="text-green-600" />
                                    ) : isGraded ? (
                                      <Clock size={16} className="text-red-500" />
                                    ) : isSubmitted ? (
                                      <Clock size={16} className="text-yellow-500" />
                                    ) : isPastDue ? (
                                      <Clock size={16} className="text-red-400" />
                                    ) : (
                                      <Clock size={16} className="text-blue-400" />
                                    )}
                                    <span className="font-medium">{assignment.title}</span>
                                    
                                    {isGraded && assignment.submission && (
                                      <span className={`text-xs ${assignment.submission.grade >= assignment.passingScore ? "text-green-500" : "text-red-500"}`}>
                                        {assignment.submission.grade >= assignment.passingScore
                                          ? `نجاح - ${assignment.submission.grade}/${assignment.passingScore}`
                                          : `رسوب - ${assignment.submission.grade}/${assignment.passingScore}`}
                                      </span>
                                    )}
                                    
                                    {!isGraded && isSubmitted && (
                                      <span className="text-xs text-yellow-500">
                                        قيد المراجعة
                                      </span>
                                    )}
                                    
                                    {!isSubmitted && isPastDue && (
                                      <span className="text-xs text-red-500">
                                        انتهى موعد التسليم
                                      </span>
                                    )}
                                    
                                    {!isSubmitted && !isPastDue && (
                                      <span className="text-xs text-blue-500">
                                        موعد التسليم: {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {isEnrolled && videoProgress.completed && (
                                    <Link
                                      href={`/course/${params.id}/video/${video.id}/assignment/${assignment.id}`}
                                      className={`hover:underline text-sm flex items-center gap-1
                                        ${isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore
                                          ? "text-green-600"
                                          : isGraded
                                          ? "text-red-500"
                                          : isSubmitted
                                          ? "text-yellow-500"
                                          : isPastDue
                                          ? "text-red-400"
                                          : "text-blue-500"}`}
                                    >
                                      {isGraded ? (
                                        <>
                                          <Check size={16} />
                                          عرض النتيجة
                                        </>
                                      ) : isSubmitted ? (
                                        <>
                                          <Clock size={16} />
                                          عرض التسليم
                                        </>
                                      ) : isPastDue ? (
                                        <>
                                          <Clock size={16} />
                                          متأخر
                                        </>
                                      ) : (
                                        <>
                                          <Clock size={16} />
                                          بدء الواجب
                                        </>
                                      )}
                                    </Link>
                                  )}
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
        
        {/* Enrollment Card - Right Side */}
        <div className="md:w-80 lg:w-96 shrink-0">
          <EnrollmentCard
            courseId={params.id}
            userId={userId}
            isEnrolled={isEnrolled}
            courseTitle={courseData.title}
            coursePrice={courseData.price || "مجاني"}
            courseDuration={courseDuration}
            questionsCount={totalQuestions.toString()}
            className="sticky top-24"
          />
        </div>
      </div>
    </div>
  );
}
  