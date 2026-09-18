"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Lock, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { AppDispatch } from "@/store/store";
import { addNotification } from "@/store/slices/uiSlice";
import { fetchBunnyPlaybackUrl, BunnyVideoError, fetchBunnyCourseVideos, formatBunnyDuration } from '@/services/bunnyVideoService';
import type { BunnyPlaybackData, BunnyVideo } from '@/types/bunny';
import type { QuizGate403 } from '@/types/quiz';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export default function VideoPage({ params }: { params: { courseSlug: string; videoSlug: string } }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Bunny playback and video metadata
  const [playbackData, setPlaybackData] = useState<BunnyPlaybackData | null>(null);
  const [bunnyVideo, setBunnyVideo] = useState<BunnyVideo | null>(null);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotEnrolled, setIsNotEnrolled] = useState(false);
  const [isNotReady, setIsNotReady] = useState(false);
  const [quizGate, setQuizGate] = useState<QuizGate403 | null>(null);

  // Video completion states
  const [completingVideo, setCompletingVideo] = useState(false);
  const [apiCompletionStatus, setApiCompletionStatus] = useState(false);
  const [completionDate, setCompletionDate] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Fetch Video Playback URL & Metadata (Bunny Stream)
  // ─────────────────────────────────────────────────────────────────────────────
  const loadVideo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsNotEnrolled(false);
      setIsNotReady(false);
      setQuizGate(null);
      setBunnyVideo(null);
      setPlaybackData(null);

      const courseVideos = await fetchBunnyCourseVideos(params.courseSlug);

      // Find matching video by public slug
      const foundVideo = courseVideos.find(
        v => v.slug === params.videoSlug
      );

      if (!foundVideo) {
        throw new BunnyVideoError('VIDEO_NOT_FOUND', 'الفيديو غير موجود في هذا الكورس', 404);
      }
      setBunnyVideo(foundVideo);

      const playback = await fetchBunnyPlaybackUrl(foundVideo.slug);
      setPlaybackData(playback);
    } catch (err: unknown) {
      if (err instanceof BunnyVideoError) {
        if (err.code === 'VIDEO_ACCESS_DENIED') {
          const body = err.body as QuizGate403 | undefined;
          const isGate = body && (
            body.code === 'SEQUENTIAL_GATE' ||
            // fallback for older backends that predate structured `code`s
            (!('code' in body) && 'quizSlug' in body)
          );
          if (isGate) {
            setQuizGate(body as QuizGate403);
          } else {
            setIsNotEnrolled(true);
          }
          return;
        } else if (err.code === 'VIDEO_NOT_READY') {
          setIsNotReady(true);
          return;
        }
      }
      setError(getErrorMessage(err, "حدث خطأ أثناء تحميل مشغل الفيديو"));
    } finally {
      setIsLoading(false);
    }
  }, [params.videoSlug, params.courseSlug]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Silent Token Refresh (proactively refreshes 5 minutes before expiresAt)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playbackData?.expiresAt || !bunnyVideo) return;

    const expiresAtMs = playbackData.expiresAt * 1000;
    const now = Date.now();
    const refreshMarginMs = 5 * 60 * 1000; // 5 minutes before expiry
    const timeUntilRefresh = expiresAtMs - now - refreshMarginMs;

    // If already expired or expiring within 10 seconds, refresh almost immediately
    const delay = Math.max(10000, timeUntilRefresh);

    const timer = setTimeout(async () => {
      try {
        const refreshed = await fetchBunnyPlaybackUrl(bunnyVideo.slug);
        setPlaybackData(refreshed);
      } catch (err) {
        console.warn('Failed to silently refresh Bunny video playback token:', err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [bunnyVideo, playbackData?.expiresAt]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Check Video Completion Status
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkVideoCompletion = async () => {
      if (!bunnyVideo) return;

      try {
        const { apiClient } = await import('@/lib/api-client');
        const data = await apiClient.get<{ videoSlug: string; completed: boolean; watchedAt: string | null }>(
          `/progress/${bunnyVideo.slug}`
        );
        if (data) {
          setApiCompletionStatus(data.completed);
          if (data.completed) {
            setCompletionDate(data.watchedAt);
          }
        }
      } catch (err) {
        console.error("Error checking video completion:", err);
      }
    };

    checkVideoCompletion();
  }, [bunnyVideo]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Handle Video Completion
  // ─────────────────────────────────────────────────────────────────────────────
  const handleCompleteVideo = useCallback(async () => {
    if (apiCompletionStatus) {
      dispatch(addNotification({
        type: 'info',
        message: 'لقد أكملت هذا الفيديو مسبقاً'
      }));
      return;
    }

    try {
      setCompletingVideo(true);
      const { apiClient } = await import('@/lib/api-client');
      const videoSlug = bunnyVideo?.slug;
      if (!videoSlug) {
        throw new Error('تعذر تحديد المحاضرة لتحديث التقدم');
      }
      await apiClient.post<{ videoSlug: string; completed: boolean; watchedAt: string | null }>(
        '/progress/complete',
        { videoSlug }
      );
      setApiCompletionStatus(true);
      setCompletionDate(new Date().toISOString());
      dispatch(addNotification({
        type: 'success',
        message: 'تم إكمال المحاضرة بنجاح!'
      }));
    } catch (err: unknown) {
      // Map structured backend codes to friendly Arabic messages.
      const errBody = (err as { body?: { code?: string } } | null)?.body;
      let message = getErrorMessage(err, 'حدث خطأ أثناء تحديث حالة الفيديو');
      if (errBody && typeof errBody === 'object' && errBody.code === 'VIDEO_NOT_UNLOCKED') {
        message = 'أكمل المحاضرة السابقة أولاً ليُتاح لك إكمال هذه المحاضرة';
      }
      dispatch(addNotification({
        type: 'error',
        message
      }));
    } finally {
      setCompletingVideo(false);
    }
  }, [apiCompletionStatus, bunnyVideo?.slug, dispatch]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Render Video Player or State Placeholders
  // ─────────────────────────────────────────────────────────────────────────────
  let playerContent;

  if (isLoading) {
    playerContent = (
      <div className="flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white/80">
        <Loader2 className="mb-3 h-10 w-10 animate-spin text-brand-primary" />
        <p className="text-sm font-medium">جاري تحميل مشغل الفيديو...</p>
      </div>
    );
  } else if (quizGate) {
    const blockingVideoSlug = quizGate.previousVideoSlug ?? quizGate.currentVideoSlug;
    playerContent = (
      <div className="flex aspect-video w-full flex-col items-center justify-center border border-amber-200 bg-amber-50 p-6 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-700 shadow-xs">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-amber-800">هذه المحاضرة غير متاحة بعد</h3>
        <p className="mb-3 max-w-md text-sm leading-relaxed text-amber-900/80">
          {quizGate.message}
        </p>
        <p className="mb-6 text-sm font-semibold text-amber-900">
          نتيجتك: {quizGate.yourScore ?? 'لم تحاول بعد'} / المطلوب: {quizGate.requiredScore ?? '--'}%
        </p>
        {blockingVideoSlug != null && (
          <button
            onClick={() => router.push(`/course/${params.courseSlug}/video/${blockingVideoSlug}/quiz`)}
            className="rounded-full bg-brand-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90"
          >
            الانتقال إلى الاختبار
          </button>
        )}
      </div>
    );
  } else if (isNotEnrolled) {
    playerContent = (
      <div className="flex aspect-video w-full flex-col items-center justify-center border border-brand-border bg-brand-surface p-6 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-700 shadow-xs">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-brand-text">المحتوى محمي للمشتركين فقط</h3>
        <p className="mb-6 max-w-md text-sm leading-relaxed text-brand-muted">
          يجب أن تكون مشتركاً في هذا الكورس لتتمكن من مشاهدة المحاضرة والاستفادة من المواد التعليمية والاختبارات.
        </p>
        <button
          onClick={() => router.push(`/course/${params.courseSlug}`)}
          className="rounded-full bg-brand-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90"
        >
          اشترك في الكورس الآن
        </button>
      </div>
    );
  } else if (isNotReady) {
    playerContent = (
      <div className="flex aspect-video w-full flex-col items-center justify-center border border-brand-border bg-brand-surface p-6 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-primary/10 text-brand-primary shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-brand-text">الفيديو قيد المعالجة</h3>
        <p className="mb-6 max-w-md text-sm leading-relaxed text-brand-muted">
          يتم حالياً تجهيز وضغط الفيديو بجودة عالية على Bunny Stream. يرجى إعادة المحاولة بعد دقائق قليلة.
        </p>
        <button
          onClick={() => loadVideo()}
          className="flex items-center gap-2 rounded-full border border-brand-border px-5 py-2 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-bg"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  } else if (error) {
    playerContent = (
      <div className="flex aspect-video w-full flex-col items-center justify-center border border-red-200 bg-brand-surface p-6 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-600 shadow-xs">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-red-700">تعذر تشغيل الفيديو</h3>
        <p className="mb-6 max-w-md text-sm text-brand-muted">
          {error}
        </p>
        <button
          onClick={() => loadVideo()}
          className="flex items-center gap-2 rounded-full border border-brand-border px-5 py-2 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-bg"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  } else if (playbackData?.playbackUrl) {
    playerContent = (
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <iframe
          src={playbackData.playbackUrl}
          loading="lazy"
          className="h-full w-full border-0"
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowFullScreen
          title={bunnyVideo?.title || "مشغل فيديو Bunny Stream"}
        />
      </div>
    );
  } else {
    playerContent = (
      <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-slate-900 to-black p-6 text-center text-sm text-white/70">
        لا توجد بيانات متاحة لهذا الفيديو
      </div>
    );
  }

  const videoTitle = bunnyVideo?.title || "المحاضرة التعليمية";
  const videoDurationFormatted = bunnyVideo?.duration != null
    ? formatBunnyDuration(bunnyVideo.duration)
    : null;
  const canTrackProgress = bunnyVideo != null && !isNotEnrolled && !quizGate;
  const quizHref = bunnyVideo ? `/course/${params.courseSlug}/video/${bunnyVideo.slug}/quiz` : undefined;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-brand-muted">
          <Link href="/" className="hover:text-brand-primary">الرئيسية</Link>
          <span>/</span>
          <Link href="/grades/1" className="hover:text-brand-primary">الدورات</Link>
          <span>/</span>
          <Link href={`/course/${params.courseSlug}`} className="hover:text-brand-primary">محتوى الدورة</Link>
          <span>/</span>
          <span className="text-brand-muted-strong">{videoTitle}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Reveal>
            {/* Video player */}
            <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-ink shadow-sm">
              {playerContent}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-brand-text">{videoTitle}</h1>
                <p className="mt-1 text-xs text-brand-muted">
                  {videoDurationFormatted ?? 'خاص بالمشتركين'}
                  {bunnyVideo?.createdAt && (
                    <> · تاريخ الإضافة {new Date(bunnyVideo.createdAt).toLocaleDateString('ar-EG')}</>
                  )}
                  {completionDate && (
                    <> · تم الإكمال: {new Date(completionDate).toLocaleDateString('ar-EG')}</>
                  )}
                </p>
              </div>
              <button
                onClick={handleCompleteVideo}
                disabled={completingVideo || apiCompletionStatus || !canTrackProgress}
                className={
                  "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 " +
                  (apiCompletionStatus
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-brand-primary text-white hover:bg-brand-primary/90")
                }
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {completingVideo
                  ? "جاري الحفظ..."
                  : apiCompletionStatus
                    ? "تم إكمال المحاضرة"
                    : "تحديد كمكتملة"}
              </button>
            </div>

            {!canTrackProgress && !isLoading && !error && (
              <p className="mt-3 text-sm text-amber-700">
                هذه المحاضرة غير مرتبطة بسجل التقدم والاختبار بعد.
              </p>
            )}
          </Reveal>

          <Reveal delayMs={100}>
            <div className="sticky top-24 rounded-2xl border border-brand-border bg-brand-surface p-5">
              <p className="text-sm font-bold text-brand-text">محتوى المحاضرة</p>
              <p className="mt-0.5 text-xs text-brand-muted">العناصر المطلوبة لإتمام هذا الدرس</p>

              <div className="mt-4 space-y-1">
                <div className="flex items-start gap-3 rounded-lg px-2.5 py-3">
                  <span className={"mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold " + (apiCompletionStatus ? "bg-emerald-100 text-emerald-600" : "bg-brand-primary/15 text-brand-primary")}>
                    {apiCompletionStatus ? "✓" : "١"}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-brand-text">الفيديو التعليمي</span>
                    <span className="mt-0.5 block text-xs text-brand-muted">
                      {videoDurationFormatted ?? 'خاص بالمشتركين'} · {apiCompletionStatus ? "تمت المشاهدة" : "قيد المشاهدة"}
                    </span>
                  </span>
                </div>

                {quizHref ? (
                  <Link
                    href={quizHref}
                    className="flex items-start gap-3 rounded-lg px-2.5 py-3 transition hover:bg-brand-bg"
                  >
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-chip text-xs font-bold text-brand-muted">
                      ٢
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-brand-text">الاختبار القصير</span>
                      <span className="mt-0.5 block text-xs text-brand-muted">انتقل إلى صفحة الاختبار للبدء</span>
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg px-2.5 py-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-chip text-xs font-bold text-brand-muted">
                      ٢
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-brand-text">الاختبار القصير</span>
                      <span className="mt-0.5 block text-xs text-brand-muted">يتاح بعد تحميل المحاضرة</span>
                    </span>
                  </div>
                )}
              </div>

              <Link
                href={`/course/${params.courseSlug}`}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-brand-border py-2.5 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-bg"
              >
                العودة إلى الدورة
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
