"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Play, 
  ArrowLeft, 
  BookOpenCheck, 
  ListVideo, 
  Lock, 
  Loader2, 
  AlertCircle, 
  RotateCcw 
} from "lucide-react";
import { AppDispatch } from "@/store/store";
import { addNotification } from "@/store/slices/uiSlice";
import { fetchAssignmentsByVideo, selectAssignments } from "@/store/slices/assignmentSlice";
import { fetchQuizMeta } from "@/store/slices/quizSlice";
import QuizIntroCard from "@/components/quiz/QuizIntroCard";
import { fetchBunnyPlaybackUrl, BunnyVideoError, fetchBunnyCourseVideos, formatBunnyDuration } from '@/services/bunnyVideoService';
import { fetchCourseById } from '@/services/courseService';
import type { BunnyPlaybackData, BunnyVideo } from '@/types/bunny';
import type { QuizGate403 } from '@/types/quiz';

export default function VideoPage({ params }: { params: { id: string; video: string } }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  // Bunny playback and video metadata
  const [playbackData, setPlaybackData] = useState<BunnyPlaybackData | null>(null);
  const [bunnyVideo, setBunnyVideo] = useState<BunnyVideo | null>(null);
  const [progressVideoId, setProgressVideoId] = useState<number | null>(null);
  
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

  // Redux store selections
  const assignments = useSelector(selectAssignments);

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

      // The playback records and progress records use different video tables.
      // Load both so progress is written against the legacy Video.id expected by /progress.
      const [courseData, courseVideos] = await Promise.all([
        fetchCourseById(params.id).catch(() => null),
        fetchBunnyCourseVideos(params.id).catch(() => [] as BunnyVideo[]),
      ]);

      // Find matching video by numeric ID or Bunny GUID string
      const foundVideo = courseVideos.find(
        v => v.id === Number(params.video) || (v as any).bunnyVideoId === params.video
      );

      if (foundVideo) {
        setBunnyVideo(foundVideo);
      }

      const foundIndex = foundVideo ? courseVideos.indexOf(foundVideo) : -1;
      const legacyVideo = courseData?.videos?.find((video) => video.title === foundVideo?.title)
        ?? (foundIndex >= 0 ? courseData?.videos?.[foundIndex] : undefined);
      setProgressVideoId(legacyVideo?.id ?? (foundVideo ? null : Number(params.video)));

      // Determine target ID to request playback token for (prefer numeric ID, fallback to param)
      const targetVideoId = foundVideo ? foundVideo.id : params.video;

      const playback = await fetchBunnyPlaybackUrl(targetVideoId);
      setPlaybackData(playback);

      // Fetch video assignments
      dispatch(fetchAssignmentsByVideo(String(targetVideoId)));
    } catch (err: any) {
      if (err instanceof BunnyVideoError) {
        if (err.code === 'VIDEO_ACCESS_DENIED') {
          const body = err.body;
          if (body && typeof body === 'object' && 'quizId' in body) {
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
      const message = err?.message || "حدث خطأ أثناء تحميل مشغل الفيديو";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params.video, params.id, dispatch]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Silent Token Refresh (proactively refreshes 5 minutes before expiresAt)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playbackData?.expiresAt) return;

    const expiresAtMs = playbackData.expiresAt * 1000;
    const now = Date.now();
    const refreshMarginMs = 5 * 60 * 1000; // 5 minutes before expiry
    const timeUntilRefresh = expiresAtMs - now - refreshMarginMs;

    // If already expired or expiring within 10 seconds, refresh almost immediately
    const delay = Math.max(10000, timeUntilRefresh);

    const timer = setTimeout(async () => {
      try {
        const refreshed = await fetchBunnyPlaybackUrl(params.video);
        setPlaybackData(refreshed);
      } catch (err) {
        console.warn('Failed to silently refresh Bunny video playback token:', err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [playbackData?.expiresAt, params.video]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Check Video Completion Status
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkVideoCompletion = async () => {
      const videoId = progressVideoId ?? Number(params.video);
      if (!Number.isFinite(videoId)) return;

      try {
        const { apiClient } = await import('@/lib/api-client');
        const data = await apiClient.get<{ videoId: number | string; completed: boolean; watchedAt: string | null }>(
          `/progress/${videoId}`
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
  }, [params.video, progressVideoId]);

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
      const videoId = progressVideoId ?? Number(params.video);
      if (!Number.isFinite(videoId)) {
        throw new Error('تعذر تحديد المحاضرة لتحديث التقدم');
      }
      await apiClient.post<{ videoId: number | string; completed: boolean; watchedAt: string | null }>(
        '/progress/complete',
        { videoId }
      );
      setApiCompletionStatus(true);
      setCompletionDate(new Date().toISOString());
      // Refresh quiz availability immediately after completion so the card does
      // not depend on a page reload or stale metadata.
      void dispatch(fetchQuizMeta(videoId));
      dispatch(addNotification({
        type: 'success',
        message: 'تم إكمال المحاضرة بنجاح!'
      }));
    } catch (err: any) {
      dispatch(addNotification({
        type: 'error',
        message: err.message || 'حدث خطأ أثناء تحديث حالة الفيديو'
      }));
    } finally {
      setCompletingVideo(false);
    }
  }, [apiCompletionStatus, params.video, progressVideoId, dispatch]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Render Video Player or State Placeholders
  // ─────────────────────────────────────────────────────────────────────────────
  let playerContent;

  if (isLoading) {
    playerContent = (
      <div className="w-full aspect-video rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-on-surface-variant">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">جاري تحميل مشغل الفيديو...</p>
      </div>
    );
  } else if (quizGate) {
    const blockingVideoId = quizGate.previousVideoId ?? quizGate.currentVideoId;
    playerContent = (
      <div className="w-full aspect-video rounded-lg bg-amber-50 border border-amber-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-amber-800 mb-2">هذه المحاضرة غير متاحة بعد</h3>
        <p className="text-sm text-amber-900/80 max-w-md mb-3 leading-relaxed">
          {quizGate.message}
        </p>
        <p className="text-sm font-semibold text-amber-900 mb-6">
          نتيجتك: {quizGate.yourScore ?? 'لم تحاول بعد'} / المطلوب: {quizGate.requiredScore ?? '--'}%
        </p>
        {blockingVideoId != null && (
          <Button
            onClick={() => router.push(`/course/${params.id}/video/${blockingVideoId}/quiz`)}
            className="rounded-md bg-[#207bff] px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#1a66d9]"
          >
            الانتقال إلى الاختبار
          </Button>
        )}
      </div>
    );
  } else if (isNotEnrolled) {
    playerContent = (
      <div className="w-full aspect-video rounded-lg bg-surface-container-low border border-outline-variant/60 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">المحتوى محمي للمشتركين فقط</h3>
        <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
          يجب أن تكون مشتركاً في هذا الكورس لتتمكن من مشاهدة المحاضرة والاستفادة من المواد التعليمية والاختبارات.
        </p>
        <Button
          onClick={() => router.push(`/course/${params.id}/subscribe`)}
          className="rounded-md bg-primary px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#0057c0]"
        >
          اشترك في الكورس الآن
        </Button>
      </div>
    );
  } else if (isNotReady) {
    playerContent = (
      <div className="w-full aspect-video rounded-lg bg-surface-container-low border border-outline-variant/60 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-primary mb-4 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">الفيديو قيد المعالجة</h3>
        <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
          يتم حالياً تجهيز وضغط الفيديو بجودة عالية على Bunny Stream. يرجى إعادة المحاولة بعد دقائق قليلة.
        </p>
        <Button
          onClick={() => loadVideo()}
          variant="outline"
          className="flex items-center gap-2 rounded-md border-outline-variant px-5 py-2 text-sm font-semibold hover:bg-surface-container"
        >
          <RotateCcw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  } else if (error) {
    playerContent = (
      <div className="w-full aspect-video rounded-lg bg-surface-container-low border border-red-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-red-700 mb-2">تعذر تشغيل الفيديو</h3>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">
          {error}
        </p>
        <Button
          onClick={() => loadVideo()}
          variant="outline"
          className="flex items-center gap-2 rounded-md border-outline-variant px-5 py-2 text-sm font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  } else if (playbackData?.playbackUrl) {
    playerContent = (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-outline-variant/60 bg-black shadow-level-2">
        <iframe
          src={playbackData.playbackUrl}
          loading="lazy"
          className="w-full h-full border-0"
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowFullScreen
          title={bunnyVideo?.title || "مشغل فيديو Bunny Stream"}
        />
      </div>
    );
  } else {
    playerContent = (
      <div className="w-full aspect-video rounded-lg bg-surface-container-low flex items-center justify-center text-center text-on-surface-variant p-6">
        لا توجد بيانات متاحة لهذا الفيديو
      </div>
    );
  }

  const videoTitle = bunnyVideo?.title || "المحاضرة التعليمية";
  const videoDurationFormatted = bunnyVideo?.duration != null 
    ? formatBunnyDuration(bunnyVideo.duration) 
    : null;
  const canTrackProgress = progressVideoId != null;

  return (
    <div className="mx-auto min-h-[80vh] w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main Video Card */}
        <Card className="relative mx-auto w-full overflow-hidden rounded-lg bg-white text-on-surface shadow-level-2">
          {/* Back to Course Button */}
          <div className="absolute top-4 left-4 z-20">
            <Button
              onClick={() => router.push(`/course/${params.id}`)}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-outline-variant bg-white text-primary shadow-level-2 transition-all hover:bg-[#e8f2ff]"
              aria-label="العودة إلى الكورس"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          <CardHeader className="border-b border-outline-variant/60 pb-4">
            <CardTitle className="text-2xl font-bold text-on-surface">مشاهدة المحاضرة</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 p-0">
            {/* Player Embed Container */}
            <div className="w-full p-4 sm:p-6 bg-[#0f172a]/5">
              {playerContent}
            </div>

            {/* Video Meta & Actions */}
            <div className="lesson-body space-y-4 p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-on-surface">{videoTitle}</h3>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                {videoDurationFormatted && (
                  <span>المدة: {videoDurationFormatted}</span>
                )}
                {bunnyVideo?.createdAt && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>تاريخ الإضافة: {new Date(bunnyVideo.createdAt).toLocaleDateString('ar-EG')}</span>
                  </>
                )}
                {completionDate && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-[#16a34a] font-medium">تم الإكمال: {new Date(completionDate).toLocaleDateString('ar-EG')}</span>
                  </>
                )}
              </div>

              {/* Video Assignments Section */}
              {assignments && assignments.length > 0 && (
                <div className="border-t border-outline-variant/60 pt-5">
                  <h4 className="text-lg font-semibold text-on-surface mb-3">الواجبات المتاحة</h4>
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between rounded-md border border-outline-variant/60 bg-surface-container-low p-4 transition-colors hover:bg-[#e8f2ff]/60">
                        <div className="flex-1">
                          <h5 className="font-medium text-on-surface">{assignment.title}</h5>
                          <p className="text-sm text-on-surface-variant mt-1">{assignment.description}</p>
                          <div className="flex items-center mt-2 text-xs text-on-surface-variant">
                            <span>نوع الواجب: {assignment.isMCQ ? "اختيار من متعدد" : "واجب عادي"}</span>
                            <span className="mx-2">•</span>
                            <span className={`${new Date(assignment.dueDate) < new Date() ? 'text-red-500' : 'text-green-600'}`}>
                              تاريخ التسليم: {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>
                        <div className="mr-4">
                          {assignment.hasSubmitted ? (
                            assignment.submission ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[#16a34a] flex items-center font-medium">
                                  <CheckCircle className="h-4 w-4 ml-1" />
                                  تم التسليم
                                </span>
                                {assignment.submission.status === "GRADED" && (
                                  <span className="text-sm mt-1">
                                    الدرجة: {assignment.submission.grade}/{assignment.passingScore}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-600 flex items-center font-medium">
                                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 ml-1"></span>
                                قيد المراجعة
                              </span>
                            )
                          ) : (
                            <Button
                              onClick={() => router.push(`/course/${params.id}/video/${params.video}/assignment/${assignment.id}`)}
                              className="rounded-md bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-[#0057c0]"
                              disabled={!apiCompletionStatus}
                            >
                              بدء الواجب
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Video Completion Button */}
              <div className="mt-6 flex justify-center border-t border-outline-variant/60 pt-6">
                <Button
                  onClick={handleCompleteVideo}
                  disabled={completingVideo || apiCompletionStatus || isNotEnrolled || !canTrackProgress}
                  className="rounded-md bg-primary px-8 py-6 text-lg text-white transition-all hover:bg-[#0057c0] disabled:opacity-70"
                >
                  {completingVideo ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : apiCompletionStatus ? (
                    <>
                      <CheckCircle className="ml-2 h-5 w-5" />
                      تم إكمال المحاضرة
                    </>
                  ) : (
                    canTrackProgress ? 'أكملت مشاهدة المحاضرة؟' : 'لا يمكن تسجيل إكمال هذه المحاضرة حالياً'
                  )}
                </Button>
              </div>

              {!canTrackProgress && (
                <p className="mt-3 text-center text-sm text-amber-700">
                  هذه المحاضرة غير مرتبطة بسجل التقدم والاختبار بعد.
                </p>
              )}

              {/* Quiz Section — QuizIntroCard fetches its own metadata and renders nothing when absent. */}
              {apiCompletionStatus && (
                <div className="border-t border-outline-variant/60 pt-5">
                  <QuizIntroCard videoId={progressVideoId ?? params.video} courseId={params.id} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-lg bg-white shadow-level-2">
            <div className="flex items-center gap-2 border-b border-outline-variant/60 p-5">
              <ListVideo className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-on-surface">محتوى الدورة</h2>
            </div>
            <div className="p-3">
              <div className="rounded-md bg-[#e8f2ff] p-4 text-primary">
                <div className="flex items-center justify-between">
                  <BookOpenCheck className="h-5 w-5" />
                  <span className="rounded-full bg-white px-2 py-1 text-caption font-bold">
                    Bunny Stream
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-on-surface">{videoTitle}</p>
                {videoDurationFormatted && (
                  <p className="mt-1 text-caption text-primary font-medium">{videoDurationFormatted}</p>
                )}
              </div>
            </div>
            <button 
              onClick={() => router.push(`/course/${params.id}`)} 
              className="flex w-full items-center justify-center gap-2 border-t border-outline-variant/60 px-4 py-4 text-sm font-bold text-primary transition-colors hover:bg-[#e8f2ff]/60"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة إلى الدورة
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
