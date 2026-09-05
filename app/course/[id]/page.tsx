'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { EnrollmentCard } from '@/components/enrollment-card';
import Link from "next/link";
import { ChevronDown, ChevronUp, Play, Check, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// Quiz metadata is loaded on the video page after completion.
import {
  fetchAssignmentStatus,
  selectAssignments,
  fetchAssignmentsByCourse
} from '@/store/slices/assignmentSlice';

import { fetchCourseById } from '@/services/courseService';
import type { VideoProgress } from '@/services/courseService';
import { fetchBunnyCourseVideos, formatBunnyDuration } from '@/services/bunnyVideoService';
import type { BunnyVideo } from '@/types/bunny';

export default function Page({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [openVideoIds, setOpenVideoIds] = useState<Record<string, boolean>>({});
  const [courseDuration, setCourseDuration] = useState<string>('0');
  const [videoProgressMap, setVideoProgressMap] = useState<Record<string, VideoProgress>>({});
  
  // Bunny Stream videos for this course
  const [bunnyVideos, setBunnyVideos] = useState<BunnyVideo[]>([]);
  
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
  const calculateCourseStats = useCallback((courseData: any, bunnyVids: BunnyVideo[]) => {
    const totalDurationInSeconds = (bunnyVids && bunnyVids.length > 0)
      ? bunnyVids.reduce((total, bv) => total + (bv.duration || 0), 0)
      : (courseData?.videos?.reduce((total: number, video: any) => total + (video.duration || 0), 0) || 0);

    setCourseDuration(formatDuration(totalDurationInSeconds));
  }, [formatDuration]);

  // Assignment status is loaded from the course overview; quiz metadata is
  // loaded by the video page after the video is completed.
  const checkVideoStatus = useCallback(async (videoId: string | number) => {
    const videoAssignments = findAssignmentsForVideo(videoId);
    if (videoAssignments.length > 0) {
      videoAssignments.forEach(assignment => {
        dispatch(fetchAssignmentStatus(assignment.id));
      });
    }
  }, [dispatch, findAssignmentsForVideo]);

  // Helper function to get video progress
  const getVideoProgress = (videoId: string | number) => {
    return videoProgressMap[String(videoId)] || { videoId, completed: false, watchedAt: null };
  };
  
  // Helper function to get assignment status
  const getAssignmentStatus = (assignmentId: number) => {
    return assignmentStatusMap[assignmentId] || null;
  };

  const fetchedCourseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedCourseIdRef.current === params.id) return;
    fetchedCourseIdRef.current = params.id;

    const loadCourseAndEnrollment = async () => {
      try {
        setIsLoading(true);
        const [data, bunnyData] = await Promise.all([
          fetchCourseById(params.id),
          fetchBunnyCourseVideos(params.id),
        ]);
        setCourseData(data);
        setVideoProgressMap(Object.fromEntries(
          (data.progress ?? []).map((progress) => [String(progress.videoId), progress]),
        ));

        // Unenrolled students cannot access the Bunny catalog endpoint, but the
        // course endpoint still exposes public video metadata and thumbnails.
        const visibleVideos = bunnyData.length > 0
          ? bunnyData
          : (data.videos ?? []).map((video, index) => ({
              id: video.id,
              courseId: Number(params.id),
              title: video.title,
              status: 'READY' as const,
              duration: video.duration ?? null,
              width: null,
              height: null,
              thumbnailUrl: video.thumbnail ?? null,
              createdAt: video.position != null ? String(video.position) : String(index),
            }));
        setBunnyVideos(visibleVideos);

        setIsEnrolled(!!data.enrollment);
        // Initialize video accordions
        const initialOpenState: Record<string, boolean> = {};
        bunnyData.forEach((bv: BunnyVideo) => {
          initialOpenState[`bunny-${bv.id}`] = false;
        });
        setOpenVideoIds(initialOpenState);

        const videoIdsToFetch = bunnyData.map(bv => bv.id);
        if (videoIdsToFetch.length > 0) {
          dispatch(fetchAssignmentsByCourse({ courseId: params.id, videoIds: videoIdsToFetch }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseAndEnrollment();
  }, [params.id, dispatch]);
  
  // Fetch status for videos when course data is loaded and user is enrolled
  useEffect(() => {
    if (isEnrolled && bunnyVideos.length > 0) {
      bunnyVideos.forEach((bv) => {
        checkVideoStatus(bv.id);
      });
    }
  }, [bunnyVideos, isEnrolled, checkVideoStatus]);

  // Calculate course statistics when course data and videos are loaded.
  useEffect(() => {
    if (courseData) {
      calculateCourseStats(courseData, bunnyVideos);
    }
  }, [courseData, bunnyVideos, calculateCourseStats]);

  if (isLoading) return <div className="text-center p-8">جاري التحميل...</div>;
  if (error) return <div className="text-center p-8 text-red-500">خطأ: {error}</div>;
  if (!courseData) return <div className="text-center p-8">لا توجد بيانات متاحة للكورس</div>;

  const totalVideosCount = bunnyVideos.length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main Content - Left Side */}
        <div className="min-w-0 flex-1">
          {/* Course Header */}
          <div className="mb-8 rounded-lg bg-primary p-6 text-on-primary sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="mb-4 text-2xl font-bold leading-10 sm:text-3xl">
                  {courseData.title || "كورس الأزهر المكثف المجاني"}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
                    ملفات {courseData.files_count || 0} +
                  </span>
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    فيديوهات {totalVideosCount} +
                  </span>
                  <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm">
                    امتحانات {courseData.exams_count || 0} +
                  </span>
                </div>
              </div>
              <div className="text-right sm:text-left">
                <p className="text-lg font-bold">{courseData.price === 0 ? "هذا الكورس مجاني !" : `السعر: ${courseData.price} جنيه`}</p>
                <p className="text-sm">{courseData.description_short || "الدورة لطلبة الأزهر فقط ❤️"}</p>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="overflow-hidden rounded-lg bg-white shadow-level-2">
            <h2 className="text-xl font-bold p-6 border-b dark:border-gray-700">محتوى الكورس</h2>
            <div className="space-y-2 p-3 sm:p-4">
              {/* ─── Video List (Bunny Stream) ───────────────────────────────── */}
              {bunnyVideos.length > 0 ? (
                bunnyVideos.map((bv, index) => {
                  const bvKey = `bunny-${bv.id}`;
                  const isOpen = !!openVideoIds[bvKey];
                  const isReady = bv.status === 'READY';
                  const isProcessing = bv.status === 'PROCESSING' || bv.status === 'UPLOADING' || bv.status === 'PENDING';
                  const isFailed = bv.status === 'FAILED';
                  const videoProgress = getVideoProgress(bv.id);
                  const videoAssignments = findAssignmentsForVideo(bv.id);

                  return (
                    <div key={bvKey} className="overflow-hidden rounded-md border border-outline-variant/70 transition-colors">
                      {/* Accordion Header */}
                      <div
                        className="cursor-pointer p-5 transition-colors hover:bg-[#e8f2ff]/50"
                        onClick={() => isReady && toggleVideo(bvKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-primary">
                              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </span>
                            <h3 className="text-lg font-semibold">المحاضرة {getArabicOrdinal(index)}</h3>

                            {/* Show video completion status */}
                            {videoProgress.completed && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs">
                                <CheckCircle size={12} className="text-green-600" />
                                <span>تم المشاهدة</span>
                              </span>
                            )}

                            {/* Processing/Failed status badges */}
                            {isProcessing && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                <Loader2 size={10} className="animate-spin" />
                                قيد المعالجة
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                <AlertTriangle size={10} />
                                فشل التحميل
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Duration badge */}
                            {isReady && bv.duration != null && (
                              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                <Clock size={12} />
                                {formatBunnyDuration(bv.duration)}
                              </span>
                            )}
                            <span className="text-sm text-on-surface-variant">{bv.title}</span>
                          </div>
                        </div>
                      </div>

                      {/* Accordion Body — only for READY videos */}
                      {isOpen && isReady && (
                        <div className="px-5 pb-5">
                          <div className="space-y-3">
                            {/* Thumbnail + Watch card */}
                            <div className="flex flex-col gap-3 rounded-md bg-surface-container-low overflow-hidden sm:flex-row sm:items-stretch">
                              {/* Thumbnail */}
                              {bv.thumbnailUrl && (
                                <div className="relative h-28 w-full shrink-0 sm:h-auto sm:w-44">
                                  <Image
                                    src={bv.thumbnailUrl}
                                    alt={bv.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, 176px"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow">
                                      <Play size={16} className="text-primary" fill="currentColor" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Info + button */}
                              <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                                <div>
                                  <p className="font-medium text-on-surface">{bv.title}</p>
                                  {bv.duration != null && (
                                    <p className="mt-1 text-xs text-on-surface-variant">
                                      المدة: {formatBunnyDuration(bv.duration)}
                                    </p>
                                  )}
                                  {videoProgress.completed && (
                                    <span className="mt-1 inline-block text-xs text-gray-500">
                                      تمت المشاهدة في {new Date(videoProgress.watchedAt || '').toLocaleDateString('ar-EG')}
                                    </span>
                                  )}
                                </div>

                                {isEnrolled ? (
                                  <Link
                                    href={`/course/${params.id}/video/${bv.id}`}
                                    className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-[#0057c0] active:bg-[#004aa0]"
                                  >
                                    {videoProgress.completed ? (
                                      <>
                                        <Check size={14} />
                                        مشاهدة مرة أخرى
                                      </>
                                    ) : (
                                      <>
                                        <Play size={14} />
                                        شاهد المحاضرة
                                      </>
                                    )}
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 self-start rounded-md bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    اشترك لمشاهدة المحاضرة
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Assignment Cards - if there are assignments for this video */}
                            {videoAssignments.map(assignment => {
                              const assignmentStatus = getAssignmentStatus(assignment.id);
                              const isPastDue = new Date(assignment.dueDate) < new Date();
                              const isSubmitted = assignment.hasSubmitted;
                              const isGraded = assignment.submission?.status === "GRADED";
                              
                              return (
                                <div 
                                  key={assignment.id}
                                  className={`flex items-center justify-between p-3 rounded-md mt-2
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
                                      href={`/course/${params.id}/video/${bv.id}/assignment/${assignment.id}`}
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
                /* Empty state — no videos */
                <div className="p-6 text-center text-gray-500">
                  لا توجد محاضرات متاحة حالياً
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Enrollment Card - Right Side */}
        <div className="shrink-0 lg:w-80">
          <EnrollmentCard
            courseId={params.id}
            userId={userId}
            isEnrolled={isEnrolled}
            courseTitle={courseData.title}
            coursePrice={courseData.price || "مجاني"}
            courseDuration={courseDuration}
            questionsCount={String(courseData.questions_count || 0)}
            className="sticky top-24"
            onEnrollSuccess={() => setIsEnrolled(true)}
          />
        </div>
      </div>
    </div>
  );
}
