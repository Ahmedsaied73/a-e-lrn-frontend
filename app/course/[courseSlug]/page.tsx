'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from "next/link";
import { ChevronDown, Lock } from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { EnrollmentCard } from '@/components/enrollment-card';

import { fetchCourseBySlug } from '@/services/courseService';
import type { VideoProgress } from '@/services/courseService';
import { fetchBunnyCourseVideos } from '@/services/bunnyVideoService';
import type { BunnyVideo } from '@/types/bunny';

const INITIAL_VISIBLE_LESSONS = 6;
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export default function Page({ params }: { params: { courseSlug: string } }) {
  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [courseDuration, setCourseDuration] = useState<string>('0');
  const [videoProgressMap, setVideoProgressMap] = useState<Record<string, VideoProgress>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_LESSONS);

  // Bunny Stream videos for this course
  const [bunnyVideos, setBunnyVideos] = useState<BunnyVideo[]>([]);

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

  // Helper function to get video progress
  const getVideoProgress = (videoSlug: string) => {
    return videoProgressMap[String(videoSlug)] || { videoSlug, completed: false, watchedAt: null };
  };

  const fetchedCourseSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedCourseSlugRef.current === params.courseSlug) return;
    fetchedCourseSlugRef.current = params.courseSlug;

    const loadCourseAndEnrollment = async () => {
      try {
        setIsLoading(true);
        const [data, bunnyData] = await Promise.all([
          fetchCourseBySlug(params.courseSlug),
          fetchBunnyCourseVideos(params.courseSlug),
        ]);
        setCourseData(data);
        // Use progress already returned by fetchCourseBySlug aggregate (no extra request)
        setVideoProgressMap(Object.fromEntries(
          (data.progress ?? []).map((progress) => [String(progress.videoSlug), progress]),
        ));

        setBunnyVideos(bunnyData);

        setIsEnrolled(!!data.enrollment);
        setVisibleCount(INITIAL_VISIBLE_LESSONS);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseAndEnrollment();
  }, [params.courseSlug]);

  // Calculate course statistics when course data and videos are loaded.
  useEffect(() => {
    if (courseData) {
      calculateCourseStats(courseData, bunnyVideos);
    }
  }, [courseData, bunnyVideos, calculateCourseStats]);

  if (isLoading) return <div className="flex justify-center p-12 text-sm text-brand-muted">جاري التحميل...</div>;
  if (error) return <div className="mx-auto mt-6 max-w-md rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-6 text-center text-sm font-medium text-brand-accent">خطأ: {error}</div>;
  if (!courseData) return <div className="p-12 text-center text-sm text-brand-muted">لا توجد بيانات متاحة للكورس</div>;

  const totalVideosCount = bunnyVideos.length;
  const sortedVideos = [...bunnyVideos].sort(
    (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER),
  );
  const shownVideos = sortedVideos.slice(0, visibleCount);
  const remainingVideos = totalVideosCount - shownVideos.length;
  const firstVideo = sortedVideos.find((bv) => bv.status === 'READY');
  const examsCount = courseData.exams_count ?? courseData.questions_count ?? 0;
  const completedCount = sortedVideos.filter((bv) => getVideoProgress(bv.slug).completed).length;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-brand-muted">
          <Link href="/" className="hover:text-brand-primary">الرئيسية</Link>
          <span>/</span>
          <Link href="/grades/1" className="hover:text-brand-primary">الدورات</Link>
          <span>/</span>
          <span className="text-brand-muted-strong">محتوى الدورة</span>
        </nav>

        {/* Main Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main Content: Title + Lessons */}
          <Reveal className="order-2 lg:order-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-brand-text sm:text-2xl">
                  {courseData.title}
                </h1>
                <p className="mt-1 text-sm text-brand-muted">مرجع الدورة {params.courseSlug}</p>
              </div>
              <span className="rounded-full bg-brand-secondary/10 px-3 py-1 text-xs font-semibold text-brand-secondary">
                منهج معتمد
              </span>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface px-5 py-4">
              <p className="text-sm font-semibold text-brand-muted-strong">محتوى الدورة والوحدات التعليمية</p>
              <span className="text-xs text-brand-muted">{totalVideosCount} محاضرات</span>
            </div>

            <div className="mt-4 space-y-3">
              {shownVideos.length > 0 ? (
                shownVideos.map((bv, index) => {
                  const completed = getVideoProgress(bv.slug).completed;
                  const isReady = bv.status === 'READY';
                  const isProcessing = bv.status === 'PROCESSING' || bv.status === 'UPLOADING' || bv.status === 'PENDING';
                  const isFailed = bv.status === 'FAILED';
                  const linkable = isEnrolled && isReady;
                  const rowClassName = 'flex items-center gap-4 rounded-xl border border-brand-border bg-brand-surface px-5 py-4 transition hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-sm' + (linkable ? '' : ' cursor-default');
                  const rowInner = (
                    <>
                      <span
                        className={
                          'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ' +
                          (completed
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-brand-chip text-brand-muted')
                        }
                      >
                        {completed ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : (
                          `${ARABIC_DIGITS[Math.floor((index + 1) / 10)]}${ARABIC_DIGITS[(index + 1) % 10]}`
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-brand-text">{bv.title || `المحاضرة ${index + 1}`}</span>
                        <span className="mt-0.5 block text-xs text-brand-muted">
                          {isReady && bv.duration != null ? (
                            formatDuration(bv.duration)
                          ) : isProcessing ? (
                            'قيد المعالجة'
                          ) : isFailed ? (
                            'فشل التحميل'
                          ) : (
                            'خاص بالمشتركين'
                          )}
                        </span>
                      </span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-primary/10 text-brand-primary">
                        {linkable ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
                        ) : (
                          <Lock className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                    </>
                  );
                  return linkable ? (
                    <Link
                      key={`bunny-${bv.slug}`}
                      href={`/course/${params.courseSlug}/video/${bv.slug}`}
                      className={rowClassName}
                    >
                      {rowInner}
                    </Link>
                  ) : (
                    <span
                      key={`bunny-${bv.slug}`}
                      className={rowClassName}
                    >
                      {rowInner}
                    </span>
                  );
                })
              ) : (
                /* Empty state — no videos */
                <Reveal className="mt-4 text-center text-sm text-brand-muted">
                  لا توجد محاضرات متاحة حالياً
                </Reveal>
              )}
            </div>

            {/* Load More Action */}
            {remainingVideos > 0 && (
              <button
                onClick={() => setVisibleCount(totalVideosCount)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-4 py-3.5 text-sm font-bold text-brand-primary shadow-sm transition hover:bg-brand-hover"
              >
                <ChevronDown size={20} aria-hidden="true" />
                عرض باقي الحصص والمحاضرات ({remainingVideos} محاضرة متبقية)
              </button>
            )}
          </Reveal>

          {/* Sidebar: Course Overview & Enrollment Card */}
          <div className="order-1 lg:order-2">
            <EnrollmentCard
              courseSlug={params.courseSlug}
              isEnrolled={isEnrolled}
              coursePrice={courseData.price || 'مجاني'}
              courseDuration={courseDuration}
              examsCount={examsCount}
              lessonsCount={totalVideosCount}
              completedCount={completedCount}
              primaryVideoHref={firstVideo ? `/course/${params.courseSlug}/video/${firstVideo.slug}` : undefined}
              onEnrollSuccess={() => setIsEnrolled(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
