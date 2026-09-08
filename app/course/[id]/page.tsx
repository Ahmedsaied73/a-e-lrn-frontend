'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { EnrollmentCard } from '@/components/enrollment-card';
import Link from "next/link";
import { ChevronDown, ChevronUp, Play, Check, CheckCircle, Clock, Loader2, AlertTriangle, Lock, BadgeCheck, FileText, BookOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// Quiz metadata is loaded on the video page after completion.
import {
  fetchAssignmentStatus,
  selectAssignments,
  fetchAssignmentsByCourse
} from '@/store/slices/assignmentSlice';

import { fetchCourseById } from '@/services/courseService';
import type { VideoProgress } from '@/services/courseService';
import { fetchBunnyCourseProgress, fetchBunnyCourseVideos, formatBunnyDuration } from '@/services/bunnyVideoService';
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
        const [data, bunnyData, progressData] = await Promise.all([
          fetchCourseById(params.id),
          fetchBunnyCourseVideos(params.id),
          fetchBunnyCourseProgress(params.id),
        ]);
        setCourseData(data);
        setVideoProgressMap(Object.fromEntries(
          progressData.videos.map((progress) => [String(progress.id), { videoId: progress.id, ...progress }]),
        ));

        setBunnyVideos(bunnyData);

        setIsEnrolled(!!data.enrollment);
        // Initialize video accordions
        const initialOpenState: Record<string, boolean> = {};
        bunnyData.forEach((bv: BunnyVideo) => {
          initialOpenState[`bunny-${bv.id}`] = false;
        });
        setOpenVideoIds(initialOpenState);
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

  if (isLoading) return <div className="flex justify-center p-12 text-sm text-on-surface-variant">جاري التحميل...</div>;
  if (error) return <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">خطأ: {error}</div>;
  if (!courseData) return <div className="p-12 text-center text-sm text-on-surface-variant">لا توجد بيانات متاحة للكورس</div>;

  const totalVideosCount = bunnyVideos.length;
  const sortedVideos = [...bunnyVideos].sort(
    (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Link href="/" className="transition-colors hover:text-[#0057c0]">الرئيسية</Link>
            <span aria-hidden="true">/</span>
            <Link href="/courses" className="transition-colors hover:text-[#0057c0]">الدورات</Link>
            <span aria-hidden="true">/</span>
            <span className="truncate font-semibold text-on-surface">{courseData.title}</span>
          </nav>

          {/* Course Header — Academic card */}
          <div className="mb-6 overflow-hidden rounded-xl border border-outline-variant/70 bg-white shadow-level-2">
            <div className="h-1.5 w-full primary-gradient" />
            <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold leading-10 text-on-surface sm:text-3xl">
                    {courseData.title || "كورس الأزهر المكثف المجاني"}
                  </h1>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    محتوى معتمد
                  </span>
                </div>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {courseData.description_short || "الدورة لطلبة الأزهر فقط ❤️"}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f2ff] px-3 py-1.5 text-xs font-semibold text-[#0057c0]">
                    <Play size={12} className="shrink-0" aria-hidden="true" />
                    فيديوهات {totalVideosCount} +
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f2ff] px-3 py-1.5 text-xs font-semibold text-[#0057c0]">
                    <Clock size={12} className="shrink-0" aria-hidden="true" />
                    {courseDuration}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f2ff] px-3 py-1.5 text-xs font-semibold text-[#0057c0]">
                    <FileText size={12} className="shrink-0" aria-hidden="true" />
                    ملفات {courseData.files_count || 0} +
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f2ff] px-3 py-1.5 text-xs font-semibold text-[#0057c0]">
                    <BookOpen size={12} className="shrink-0" aria-hidden="true" />
                    امتحانات {courseData.exams_count || 0} +
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <p className="text-lg font-bold text-on-surface">
                  {courseData.price === 0 ? "هذا الكورس مجاني" : `السعر: ${courseData.price} جنيه`}
                </p>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="overflow-hidden rounded-xl border border-outline-variant/70 bg-white shadow-level-2">
            <h2 className="border-b border-outline-variant/70 p-6 text-xl font-bold text-on-surface">
              محتوى الدورة والوحدات التعليمية
            </h2>
            <div className="space-y-2 p-3 sm:p-4">
              {/* ─── Video List (Bunny Stream) ───────────────────────────────── */}
              {sortedVideos.length > 0 ? (
                sortedVideos.map((bv, index) => {
                  const bvKey = `bunny-${bv.id}`;
                  const isOpen = !!openVideoIds[bvKey];
                  const isReady = bv.status === 'READY';
                  const isProcessing = bv.status === 'PROCESSING' || bv.status === 'UPLOADING' || bv.status === 'PENDING';
                  const isFailed = bv.status === 'FAILED';
                  const videoProgress = getVideoProgress(bv.id);
                  const videoAssignments = findAssignmentsForVideo(bv.id);

                  return (
                    <div key={bvKey} className="overflow-hidden rounded-md border border-outline-variant/70 transition-colors">
                      {/* Lesson Row */}
                      <div
                        className="cursor-pointer p-4 transition-colors hover:bg-[#e8f2ff]/50 sm:p-5"
                        onClick={() => isReady && toggleVideo(bvKey)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-[#207bff]">
                              {isEnrolled ? (
                                isOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />
                              ) : (
                                <Lock size={14} aria-hidden="true" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-on-surface">المحاضرة {getArabicOrdinal(index)}</h3>
                              <p className="truncate text-xs text-on-surface-variant">{bv.title}</p>
                            </div>

                            {/* Show video completion status */}
                            {videoProgress.completed && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                <CheckCircle size={12} className="text-emerald-600" aria-hidden="true" />
                                تم المشاهدة
                              </span>
                            )}

                            {/* Processing/Failed status badges */}
                            {isProcessing && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                                قيد المعالجة
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                <AlertTriangle size={10} aria-hidden="true" />
                                فشل التحميل
                              </span>
                            )}

                            {/* Assignment badge */}
                            {videoAssignments.length > 0 && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e8f2ff] px-2 py-0.5 text-xs font-medium text-[#0057c0]">
                                <FileText size={10} aria-hidden="true" />
                                واجب
                              </span>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {/* Duration badge */}
                            {isReady && bv.duration != null && (
                              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                                <Clock size={12} aria-hidden="true" />
                                {formatBunnyDuration(bv.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Accordion Body — only for READY videos */}
                      {isOpen && isReady && (
                        <div className="px-5 pb-5">
                          <div className="space-y-3">
                            {/* Thumbnail + Watch card */}
                            <div className="flex flex-col gap-3 overflow-hidden rounded-md bg-surface-container-low sm:flex-row sm:items-stretch">
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
                                    <span className="mt-1 inline-block text-xs text-on-surface-variant/70">
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
                                    <Lock size={14} />
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
                                  className={`flex items-center justify-between gap-2 border p-3 rounded-md mt-2
                                    ${isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore
                                      ? "bg-emerald-50 border-emerald-300"
                                      : isGraded
                                      ? "bg-red-50 border-red-300"
                                      : isSubmitted
                                      ? "bg-amber-50 border-amber-300"
                                      : isPastDue
                                      ? "bg-slate-50 border-red-300"
                                      : "bg-slate-50 border-blue-300"}`}
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    {isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore ? (
                                      <CheckCircle size={16} className="text-emerald-600" />
                                    ) : isGraded ? (
                                      <Clock size={16} className="text-red-500" />
                                    ) : isSubmitted ? (
                                      <Clock size={16} className="text-amber-500" />
                                    ) : isPastDue ? (
                                      <Clock size={16} className="text-red-400" />
                                    ) : (
                                      <Clock size={16} className="text-sky-500" />
                                    )}
                                    <span className="font-medium text-on-surface">{assignment.title}</span>

                                    {isGraded && assignment.submission && (
                                      <span className={`text-xs ${assignment.submission.grade >= assignment.passingScore ? "text-emerald-600" : "text-red-500"}`}>
                                        {assignment.submission.grade >= assignment.passingScore
                                          ? `نجاح - ${assignment.submission.grade}/${assignment.passingScore}`
                                          : `رسوب - ${assignment.submission.grade}/${assignment.passingScore}`}
                                      </span>
                                    )}

                                    {!isGraded && isSubmitted && (
                                      <span className="text-xs text-amber-500">
                                        قيد المراجعة
                                      </span>
                                    )}

                                    {!isSubmitted && isPastDue && (
                                      <span className="text-xs text-red-500">
                                        انتهى موعد التسليم
                                      </span>
                                    )}

                                    {!isSubmitted && !isPastDue && (
                                      <span className="text-xs text-sky-600">
                                        موعد التسليم: {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
                                      </span>
                                    )}
                                  </div>

                                  {isEnrolled && videoProgress.completed && (
                                    <Link
                                      href={`/course/${params.id}/video/${bv.id}/assignment/${assignment.id}`}
                                      className={`hover:underline text-sm flex items-center gap-1 shrink-0
                                        ${isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore
                                          ? "text-emerald-600"
                                          : isGraded
                                          ? "text-red-500"
                                          : isSubmitted
                                          ? "text-amber-500"
                                          : isPastDue
                                          ? "text-red-400"
                                          : "text-sky-600"}`}
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
                <div className="rounded-lg border border-dashed border-outline-variant bg-surface p-8 text-center text-sm text-on-surface-variant">
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