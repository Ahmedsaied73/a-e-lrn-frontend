"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { AppDispatch } from "@/store/store";
import { completeVideo, fetchQuizzesByCourse, selectQuizzes, selectVideoCompleted, setVideoCompleted } from "@/store/slices/quizSlice";
import { addNotification } from "@/store/slices/uiSlice";

export default function VideoPage({ params }: { params: { id: string; video: string } }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const [videoData, setVideoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingVideo, setCompletingVideo] = useState(false);
  
  // Get quiz state from Redux store
  const quizzes = useSelector(selectQuizzes);
  const videoCompleted = useSelector(selectVideoCompleted);

  useEffect(() => {
    const fetchVideoData = async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        setError("Not authenticated");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:3005/stream/video/${params.video}/url`, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setVideoData(data);
          
          // Fetch available quizzes for this course
          dispatch(fetchQuizzesByCourse(params.id));
        } else {
          setError("حدث خطأ أثناء تحميل الفيديو");
        }
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الفيديو");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideoData();
    
    // Reset video completion status when component mounts
    dispatch(setVideoCompleted(false));
  }, [params.video, params.id, dispatch]);
  
  // Handle video completion
  const handleCompleteVideo = async () => {
    try {
      setCompletingVideo(true);
      await dispatch(completeVideo({ videoId: params.video })).unwrap();
      // Find quiz for this video
      const videoQuiz = quizzes.find(quiz => quiz.videoId === Number(params.video));
      if (videoQuiz) {
        // Navigate to the quiz page
        router.push(`/course/${params.id}/video/${params.video}/quiz/${videoQuiz.id}`);
      } else {
        dispatch(addNotification({
          type: 'info',
          message: 'لا يوجد اختبار متاح لهذا الفيديو'
        }));
      }
    } catch (err) {
      dispatch(addNotification({
        type: 'error',
        message: 'حدث خطأ أثناء تسجيل اكتمال الفيديو'
      }));
    } finally {
      setCompletingVideo(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[300px] text-lg text-primary-foreground">جاري التحميل...</div>;
  if (error) return <div className="flex justify-center items-center min-h-[300px] text-lg text-destructive">خطأ: {error}</div>;
  if (!videoData) return <div className="flex justify-center items-center min-h-[300px] text-lg text-muted-foreground">لا يوجد بيانات للفيديو</div>;

  // Determine how to render the video
  let videoElement = null;
  if (videoData.isYoutube && videoData.embedHtml) {
    let youtubeId = null;
    if (videoData.url) {
      const match = videoData.url.match(/[?&]v=([^&#]+)/) || videoData.url.match(/youtu\.be\/([^?&#]+)/);
      youtubeId = match ? match[1] : null;
    }
    if (!youtubeId && videoData.embedHtml) {
      const match = videoData.embedHtml.match(/embed\/(.*?)\?/) || videoData.embedHtml.match(/embed\/(.*?)"/);
      youtubeId = match ? match[1] : null;
    }
    if (youtubeId) {
      videoElement = (
        <div className="aspect-video rounded-lg overflow-hidden border border-muted bg-muted relative youtube-frame-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&controls=1&fs=1&playsinline=1`}
            title={videoData.title || "YouTube video"}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full youtube-iframe-custom"
            frameBorder="0"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            tabIndex={-1}
            referrerPolicy="no-referrer"
            aria-label="مشغل فيديو YouTube"
            style={{zIndex:1}}
          />
          {/* طبقة شفافة لإخفاء زر مشاهدة على يوتيوب */}
          <div style={{position:'absolute',right:0,bottom:0,width:'120px',height:'40px',background:'rgba(0,0,0,0.7)',zIndex:2,pointerEvents:'none',borderBottomRightRadius:'12px'}}></div>
        </div>
      );
    } else {
      videoElement = <div className="text-center text-muted-foreground">لا يمكن عرض الفيديو</div>;
    }
  } else if (videoData.streamUrl) {
    videoElement = <video controls src={videoData.streamUrl} className="w-full aspect-video rounded-lg border border-muted bg-muted" />;
  } else if (videoData.url) {
    videoElement = <video controls src={videoData.url} className="w-full aspect-video rounded-lg border border-muted bg-muted" />;
  } else {
    videoElement = <div className="text-center text-muted-foreground">لا يمكن عرض الفيديو</div>;
  }

  return (
    <div className="flex justify-center items-start py-8 px-2 min-h-[80vh] bg-background">
      <Card className="w-full max-w-3xl mx-auto shadow-lg border border-muted bg-card text-card-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-primary-foreground">مشاهدة الفيديو</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            {videoElement}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-primary-foreground">{videoData.title || "عنوان الفيديو غير متوفر"}</h3>
            <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
              <span>تاريخ النشر: {videoData.date || "غير متوفر"}</span>
              <span>عدد المشاهدات: {videoData.views || "غير متوفر"}</span>
            </div>
            <p className="text-base text-card-foreground leading-relaxed">{videoData.description || "وصف الفيديو غير متوفر"}</p>
            
            {/* Video Completion Button */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleCompleteVideo}
                disabled={completingVideo || videoCompleted}
                className="bg-[#61B846] hover:bg-[#61B846]/90 text-white px-8 py-6 text-lg rounded-lg transition-all"
              >
                {completingVideo ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2"></span>
                    جاري التحميل...
                  </>
                ) : videoCompleted ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    تم إكمال الفيديو
                  </>
                ) : (
                  'أكملت الفيديو؟'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}