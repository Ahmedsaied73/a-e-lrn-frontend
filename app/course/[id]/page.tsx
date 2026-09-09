'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { EnrollmentCard } from '@/components/enrollment-card';
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Home,
  Loader2,
  Lock,
  Play,
  PlayCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// Quiz metadata is loaded on the video page after completion.
import {
  fetchAssignmentStatus,
  selectAssignments,
} from '@/store/slices/assignmentSlice';

import { fetchCourseById } from '@/services/courseService';
import type { VideoProgress } from '@/services/courseService';
import { fetchBunnyCourseProgress, fetchBunnyCourseVideos } from '@/services/bunnyVideoService';
import type { BunnyVideo } from '@/types/bunny';

const INITIAL_VISIBLE_LESSONS = 6;

const GRADE_LABELS: Record<string, string> = {
  FIRST_SECONDARY: 'الصف الأول الثانوي',
  SECOND_SECONDARY: 'الصف الثاني الثانوي',
  THIRD_SECONDARY: 'الصف الثالث الثانوي',
};

export default function Page({ params }: { params: { id: string } }) {
  const dispatch = useAppDispatch();
  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [openVideoIds, setOpenVideoIds] = useState<Record<string, boolean>>({});
  const [courseDuration, setCourseDuration] = useState<string>('0');
  const [videoProgressMap, setVideoProgressMap] = useState<Record<string, VideoProgress>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_LESSONS);

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

  // Helper function to find assignments for a specific video
  const findAssignmentsForVideo = useCallback((videoId: number | string) => {
    const videoIdNum = typeof videoId === 'string' ? parseInt(videoId, 10) : videoId;
    return assignments.filter(assignment => assignment.videoId === videoIdNum);
  }, [assignments]);

  // Helper function to format duration from seconds (natural Arabic form)
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

  // Helper function to calculate total course duration
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
        setVisibleCount(INITIAL_VISIBLE_LESSONS);
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
  const shownVideos = sortedVideos.slice(0, visibleCount);
  const remainingVideos = totalVideosCount - shownVideos.length;
  const firstVideo = sortedVideos.find((bv) => bv.status === 'READY');
  const thumbnailUrl =
    courseData.thumbnail && String(courseData.thumbnail).startsWith('http')
      ? String(courseData.thumbnail)
      : null;
  const gradeLabel = courseData.grade ? GRADE_LABELS[courseData.grade] : undefined;
  const examsCount = courseData.exams_count ?? courseData.questions_count ?? 0;

  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-margin-mobile pb-xl pt-6 lg:px-margin-desktop">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[13px] font-medium text-on-surface-variant">
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-primary">
            <Home size={16} aria-hidden="true" />
            الرئيسية
          </Link>
          <ChevronRight size={14} className="rotate-180 text-outline" aria-hidden="true" />
          <Link href="/grades/1" className="transition-colors hover:text-primary">الدورات</Link>
          <ChevronRight size={14} className="rotate-180 text-outline" aria-hidden="true" />
          <span className="truncate text-on-surface-variant">{courseData.title}</span>
          <ChevronRight size={14} className="rotate-180 text-outline" aria-hidden="true" />
          <span className="font-bold text-primary">محتوى الدورة</span>
        </nav>

        {/* Main Grid Layout */}
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          {/* Main Content: Modules & Lessons */}
          <div className="flex w-full flex-col gap-6 lg:w-2/3">
            {/* Header Card with Filter Tabs */}
            <div className="flex flex-col gap-5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <h1 className="text-headline-md font-bold text-on-surface">
                      محتوى الدورة والوحدات التعليمية
                    </h1>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-bold text-primary">
                      {totalVideosCount} محاضرة
                    </span>
                  </div>
                  <p className="text-[14px] text-on-surface-variant">
                    {courseData.description_short || courseData.description || 'منهج شامل ومكثف مع حل تدريبات وامتحانات تفاعلية'}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-[13px] font-medium text-on-surface-variant">
                  <BadgeCheck size={16} className="text-primary" aria-hidden="true" />
                  منهج معتمد
                </span>
              </div>

              {/* Module Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/40 pb-1">
                <button className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-[14px] font-bold text-on-primary shadow-sm transition-all">
                  جميع المحاضرات ({totalVideosCount})
                </button>
              </div>
            </div>

            {/* Lessons List Container */}
            <div className="flex flex-col gap-4">
              {shownVideos.length > 0 ? (
                shownVideos.map((bv, index) => {
                  const bvKey = `bunny-${bv.id}`;
                  const isOpen = !!openVideoIds[bvKey];
                  const isReady = bv.status === 'READY';
                  const isProcessing = bv.status === 'PROCESSING' || bv.status === 'UPLOADING' || bv.status === 'PENDING';
                  const isFailed = bv.status === 'FAILED';
                  const videoProgress = getVideoProgress(bv.id);
                  const videoAssignments = findAssignmentsForVideo(bv.id);
                  const completed = videoProgress.completed;

                  return (
                    <div
                      key={bvKey}
                      className="group relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                    >
                      {/* Accent bar */}
                      <div
                        className={`absolute right-0 top-0 bottom-0 w-1.5 transition-all ${
                          completed ? 'bg-emerald-500' : 'bg-primary/30 group-hover:bg-primary'
                        }`}
                      />

                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-4 sm:items-center">
                          {/* Lesson number */}
                          <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-[18px] font-bold shadow-sm transition-all ${
                              completed
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-surface-container-high text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary'
                            }`}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </div>

                          <div>
                            {/* Chips */}
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              {!isEnrolled && isReady && (
                                <span className="flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                                  <Lock size={13} aria-hidden="true" />
                                  خاص بالمشتركين
                                </span>
                              )}
                              {completed && (
                                <span className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                  <Check size={13} aria-hidden="true" />
                                  تم المشاهدة
                                </span>
                              )}
                              {isProcessing && (
                                <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                                  قيد المعالجة
                                </span>
                              )}
                              {isFailed && (
                                <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                                  <AlertTriangle size={11} aria-hidden="true" />
                                  فشل التحميل
                                </span>
                              )}
                              {videoAssignments.length > 0 && (
                                <span className="flex items-center gap-1 rounded-md bg-primary-fixed px-2 py-0.5 text-[11px] font-medium text-on-primary-fixed-variant">
                                  <FileText size={11} aria-hidden="true" />
                                  واجب مرفق
                                </span>
                              )}
                            </div>

                            <h3 className="text-[16px] font-bold leading-snug text-on-surface transition-colors group-hover:text-primary">
                              {bv.title || `المحاضرة ${index + 1}`}
                            </h3>

                            {/* Meta row */}
                            <div className="mt-2 flex items-center gap-4 text-[12px] font-medium text-on-surface-variant">
                              {isReady && bv.duration != null ? (
                                <span className="flex items-center gap-1">
                                  <PlayCircle size={15} className="text-primary" aria-hidden="true" />
                                  {formatDuration(bv.duration)}
                                </span>
                              ) : isProcessing ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 size={15} className="animate-spin text-amber-600" aria-hidden="true" />
                                  جاري تجهيز المحاضرة
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isEnrolled && isReady ? (
                            <button
                              onClick={() => toggleVideo(bvKey)}
                              aria-label={isOpen ? 'إغلاق المحاضرة' : 'فتح المحاضرة'}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/60 text-outline transition-all group-hover:border-primary group-hover:text-primary"
                            >
                              {isOpen ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronRight size={20} className="rotate-180" aria-hidden="true" />}
                            </button>
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-outline">
                              <Lock size={16} aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Accordion Body — only for READY videos */}
                      {isOpen && isReady && (
                        <div className="pt-5">
                          <div className="space-y-3">
                            {/* Thumbnail + Watch card */}
                            <div className="flex flex-col gap-3 overflow-hidden rounded-xl bg-surface-container-low sm:flex-row sm:items-stretch">
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
                                      <Play size={16} className="text-primary" fill="currentColor" aria-hidden="true" />
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
                                      المدة: {formatDuration(bv.duration)}
                                    </p>
                                  )}
                                  {completed && (
                                    <span className="mt-1 inline-block text-xs text-on-surface-variant/70">
                                      تمت المشاهدة في {new Date(videoProgress.watchedAt || '').toLocaleDateString('ar-EG')}
                                    </span>
                                  )}
                                </div>

                                {isEnrolled ? (
                                  <Link
                                    href={`/course/${params.id}/video/${bv.id}`}
                                    className="inline-flex items-center gap-1.5 self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
                                  >
                                    {completed ? (
                                      <>
                                        <Check size={14} aria-hidden="true" />
                                        مشاهدة مرة أخرى
                                      </>
                                    ) : (
                                      <>
                                        <Play size={14} aria-hidden="true" />
                                        شاهد المحاضرة
                                      </>
                                    )}
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant">
                                    <Lock size={14} aria-hidden="true" />
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
                                  className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                                    isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore
                                      ? "bg-emerald-50 border-emerald-200"
                                      : isGraded
                                      ? "bg-red-50 border-red-200"
                                      : isSubmitted
                                      ? "bg-amber-50 border-amber-200"
                                      : isPastDue
                                      ? "bg-surface-container border-red-200"
                                      : "bg-surface-container border-primary-fixed-dim"
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    {isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore ? (
                                      <CheckCircle size={16} className="text-emerald-600" aria-hidden="true" />
                                    ) : isGraded ? (
                                      <CheckCircle size={16} className="text-red-500" aria-hidden="true" />
                                    ) : isSubmitted ? (
                                      <Clock size={16} className="text-amber-500" aria-hidden="true" />
                                    ) : isPastDue ? (
                                      <Clock size={16} className="text-red-400" aria-hidden="true" />
                                    ) : (
                                      <FileText size={16} className="text-sky-600" aria-hidden="true" />
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
                                      className={`flex shrink-0 items-center gap-1 text-sm hover:underline ${
                                        isGraded && assignment.submission && assignment.submission.grade >= assignment.passingScore
                                          ? "text-emerald-600"
                                          : isGraded
                                          ? "text-red-500"
                                          : isSubmitted
                                          ? "text-amber-500"
                                          : isPastDue
                                          ? "text-red-400"
                                          : "text-sky-600"
                                      }`}
                                    >
                                      {isGraded ? (
                                        <>
                                          <Check size={16} aria-hidden="true" />
                                          عرض النتيجة
                                        </>
                                      ) : isSubmitted ? (
                                        <>
                                          <FileText size={16} aria-hidden="true" />
                                          عرض التسليم
                                        </>
                                      ) : isPastDue ? (
                                        <>
                                          <Check size={16} aria-hidden="true" />
                                          متأخر
                                        </>
                                      ) : (
                                        <>
                                          <FileText size={16} aria-hidden="true" />
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
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface p-8 text-center text-sm text-on-surface-variant">
                  لا توجد محاضرات متاحة حالياً
                </div>
              )}
            </div>

            {/* Load More Action */}
            {remainingVideos > 0 && (
              <button
                onClick={() => setVisibleCount(totalVideosCount)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-[14px] font-bold text-primary shadow-sm transition-all hover:bg-surface-container-low"
              >
                <ChevronDown size={20} aria-hidden="true" />
                عرض باقي الحصص والمحاضرات ({remainingVideos} محاضرة متبقية)
              </button>
            )}
          </div>

          {/* Sidebar: Course Overview & Enrollment Card */}
          <aside className="w-full flex-shrink-0 lg:w-1/3">
            <EnrollmentCard
              courseId={params.id}
              isEnrolled={isEnrolled}
              courseTitle={courseData.title}
              coursePrice={courseData.price || 'مجاني'}
              courseDuration={courseDuration}
              examsCount={examsCount}
              lessonsCount={totalVideosCount}
              thumbnail={thumbnailUrl}
              gradeLabel={gradeLabel}
              primaryVideoHref={firstVideo ? `/course/${params.id}/video/${firstVideo.id}` : undefined}
              className="sticky top-24"
              onEnrollSuccess={() => setIsEnrolled(true)}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}