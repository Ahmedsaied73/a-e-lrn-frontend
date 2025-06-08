"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Play, Pause, Volume2, VolumeX, Settings, Maximize, SkipForward, ChevronUp, ArrowLeft } from "lucide-react";
import { AppDispatch } from "@/store/store";
import { completeVideo, fetchQuizzesByCourse, selectQuizzes, selectVideoCompleted, setVideoCompleted } from "@/store/slices/quizSlice";
import { addNotification } from "@/store/slices/uiSlice";
import { fetchAssignmentsByVideo, selectAssignments } from "@/store/slices/assignmentSlice";

export default function VideoPage({ params }: { params: { id: string; video: string } }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const [videoData, setVideoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingVideo, setCompletingVideo] = useState(false);
  const [apiCompletionStatus, setApiCompletionStatus] = useState(false);
  const [completionDate, setCompletionDate] = useState<string | null>(null);
  
  // Interactive UI states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(490); // 8 min 10 sec in seconds
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Get quiz state from Redux store
  const quizzes = useSelector(selectQuizzes);
  const videoCompleted = useSelector(selectVideoCompleted);
  
  // Get assignments state from Redux store
  const assignments = useSelector(selectAssignments);

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Check if the video is already completed
  useEffect(() => {
    const checkVideoCompletion = async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return;
      
      try {
        const response = await fetch(`http://localhost:3005/progress/${params.video}`, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiCompletionStatus(data.completed);
          if (data.completed) {
            setCompletionDate(data.watchedAt);
            dispatch(setVideoCompleted(true));
          }
        }
      } catch (err) {
        console.error("Error checking video completion:", err);
      }
    };
    
    checkVideoCompletion();
  }, [params.video, dispatch]);

  // Handle video completion
  const handleCompleteVideo = useCallback(async () => {
    // If already completed via API check, don't submit again
    if (apiCompletionStatus) {
      // Just navigate to quiz if available
      const videoQuiz = quizzes.find(quiz => quiz.videoId === Number(params.video));
      if (videoQuiz) {
        router.push(`/course/${params.id}/video/${params.video}/quiz/${videoQuiz.id}`);
      } else {
        dispatch(addNotification({
          type: 'info',
          message: 'لا يوجد اختبار متاح لهذا الفيديو'
        }));
      }
      return;
    }
    
    try {
      setCompletingVideo(true);
      await dispatch(completeVideo({ videoId: params.video })).unwrap();
      // Update local state to reflect completion
      setApiCompletionStatus(true);
      setCompletionDate(new Date().toISOString());
      
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
  }, [apiCompletionStatus, quizzes, params.video, params.id, router, dispatch]);

  // Start progress simulation
  useEffect(() => {
    if (isPlaying) {
      // Start timer to update progress
      progressTimer.current = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 1;
          
          // Calculate new progress percentage
          const newPercent = (newTime / duration) * 100;
          setProgressPercent(newPercent > 100 ? 100 : newPercent);
          
          // If reached end, stop playing
          if (newTime >= duration) {
            setIsPlaying(false);
            if (progressTimer.current) {
              clearInterval(progressTimer.current);
            }
            
            // Auto-complete video when it ends
            if (newPercent >= 100) {
              handleCompleteVideo();
            }
          }
          
          return newTime > duration ? duration : newTime;
        });
      }, 1000);
    } else if (progressTimer.current) {
      // Clear timer when paused
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    
    // Cleanup on unmount
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
    };
  }, [isPlaying, duration, handleCompleteVideo]);

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
          
          // Fetch available assignments for this video
          dispatch(fetchAssignmentsByVideo(params.video));
          
          // if the user didn't complete the previous video, redirect to the first video
        }else if (response.status === 403) {
          setError("كمل الفيديو اللي قبل ده الاول");
        }
         else {
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
    if (!apiCompletionStatus) {
      dispatch(setVideoCompleted(false));
    }
  }, [params.video, params.id, dispatch, apiCompletionStatus]);
  
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
        <div className="aspect-video rounded-lg overflow-hidden border border-gray-700 bg-black relative youtube-frame-wrapper">
          {/* Custom YouTube-like header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center bg-black bg-opacity-90 text-white p-2 px-4">
            <div className="flex items-center">
              <span className="text-sm md:text-base font-medium truncate">
                (٨) {videoData.title || "Learn JavaScript - Full Course for Beginners"}
              </span>
            </div>
            <div className="relative">
              <button disabled className="text-sm bg-transparent rounded px-3 py-1 pointer-events-none opacity-100">
                Share
              </button>
              {/* Yellow border overlay */}
              <div className="absolute inset-0 border-2 border-[#FFE500] rounded pointer-events-none"></div>
            </div>
          </div>
          
          {/* YouTube iframe */}
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&controls=1&fs=1&playsinline=1&origin=http://localhost:3000`}
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
          
          {/* Custom YouTube-like footer */}
          <div className="absolute bottom-12 right-4 z-20">
            <div className="relative">
              <button disabled className="bg-black bg-opacity-80 rounded px-3 py-1.5 text-white flex items-center pointer-events-none text-xs">
                <span className="mr-1">Watch on</span>
                <svg viewBox="0 0 90 20" className="h-4 inline-block">
                  <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000"></path>
                  <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"></path>
                  <path d="M34.6024 13.0036L31.3945 1.41846H34.1932L35.3174 6.6701C35.6043 7.96361 35.8136 9.06662 35.95 9.97913H36.0323C36.1264 9.32532 36.3381 8.22937 36.665 6.68892L37.8291 1.41846H40.6278L37.3799 13.0036V18.561H34.6001V13.0036H34.6024Z" fill="white"></path>
                  <path d="M41.4697 18.1937C40.9053 17.8127 40.5031 17.22 40.2632 16.4157C40.0257 15.6114 39.9058 14.5437 39.9058 13.2078V11.3898C39.9058 10.0422 40.0422 8.95805 40.315 8.14196C40.5878 7.32588 41.0135 6.72851 41.592 6.35457C42.1706 5.98063 42.9302 5.79248 43.871 5.79248C44.7976 5.79248 45.5384 5.98298 46.0981 6.36398C46.6555 6.74497 47.0647 7.34234 47.3234 8.15137C47.5821 8.96275 47.7115 10.0422 47.7115 11.3898V13.2078C47.7115 14.5437 47.5845 15.6161 47.3329 16.4251C47.0812 17.2365 46.672 17.8292 46.1075 18.2031C45.5431 18.5771 44.7764 18.7652 43.8098 18.7652C42.8126 18.7675 42.0342 18.5747 41.4697 18.1937ZM44.6353 16.2323C44.7905 15.8231 44.8705 15.1575 44.8705 14.2309V10.3292C44.8705 9.43077 44.7929 8.77225 44.6353 8.35833C44.4777 7.94206 44.2026 7.7351 43.8074 7.7351C43.4265 7.7351 43.156 7.94206 43.0008 8.35833C42.8432 8.77461 42.7656 9.43077 42.7656 10.3292V14.2309C42.7656 15.1575 42.8408 15.8254 42.9914 16.2323C43.1419 16.6415 43.4123 16.8461 43.8074 16.8461C44.2026 16.8461 44.4777 16.6415 44.6353 16.2323Z" fill="white"></path>
                  <path d="M56.8154 18.5634H54.6094L54.3648 17.03H54.3037C53.7039 18.1871 52.8055 18.7656 51.6061 18.7656C50.7759 18.7656 50.1621 18.4928 49.767 17.9496C49.3719 17.4039 49.1743 16.5526 49.1743 15.3955V6.03751H51.9942V15.2308C51.9942 15.7906 52.0553 16.188 52.1776 16.4256C52.2999 16.6631 52.5045 16.783 52.7914 16.783C53.036 16.783 53.2712 16.7078 53.497 16.5573C53.7228 16.4067 53.8874 16.2162 53.9979 15.9858V6.03516H56.8154V18.5634Z" fill="white"></path>
                  <path d="M64.4755 3.68758H61.6768V18.5629H58.9181V3.68758H56.1194V1.42041H64.4755V3.68758Z" fill="white"></path>
                  <path d="M71.2768 18.5634H69.0708L68.8262 17.03H68.7651C68.1654 18.1871 67.267 18.7656 66.0675 18.7656C65.2373 18.7656 64.6235 18.4928 64.2284 17.9496C63.8333 17.4039 63.6357 16.5526 63.6357 15.3955V6.03751H66.4556V15.2308C66.4556 15.7906 66.5167 16.188 66.639 16.4256C66.7613 16.6631 66.9659 16.783 67.2529 16.783C67.4974 16.783 67.7326 16.7078 67.9584 16.5573C68.1842 16.4067 68.3488 16.2162 68.4593 15.9858V6.03516H71.2768V18.5634Z" fill="white"></path>
                  <path d="M80.609 8.0387C80.4373 7.24849 80.1621 6.67699 79.7812 6.32186C79.4002 5.96674 78.8757 5.79035 78.2078 5.79035C77.6904 5.79035 77.2059 5.93616 76.7567 6.23014C76.3075 6.52412 75.9594 6.90747 75.7148 7.38489H75.6937V0.785645H72.9773V18.5608H75.3056L75.5925 17.3755H75.6537C75.8724 17.7988 76.1993 18.1304 76.6344 18.3774C77.0695 18.622 77.554 18.7443 78.0855 18.7443C79.038 18.7443 79.7412 18.3045 80.1904 17.4272C80.6396 16.5475 80.8653 15.1765 80.8653 13.3092V11.3266C80.8653 9.92722 80.7783 8.82892 80.609 8.0387ZM78.0243 13.1492C78.0243 14.0617 77.9867 14.7767 77.9114 15.2941C77.8362 15.8115 77.7115 16.1808 77.5328 16.3971C77.3564 16.6158 77.1165 16.724 76.8178 16.724C76.585 16.724 76.371 16.6699 76.1734 16.5594C75.9759 16.4512 75.816 16.2866 75.6937 16.0702V8.96062C75.7877 8.6196 75.9524 8.34209 76.1852 8.12337C76.4157 7.90465 76.6697 7.79646 76.9401 7.79646C77.2271 7.79646 77.4481 7.90935 77.6034 8.13278C77.7609 8.35855 77.8691 8.73485 77.9303 9.26636C77.9914 9.79787 78.022 10.5528 78.022 11.5335V13.1492H78.0243Z" fill="white"></path>
                  <path d="M84.8657 13.8712C84.8657 14.6755 84.8892 15.2776 84.9363 15.6798C84.9833 16.0819 85.0821 16.3736 85.2326 16.5594C85.3831 16.7428 85.6136 16.8345 85.9264 16.8345C86.3474 16.8345 86.639 16.6699 86.8016 16.343C86.9643 16.0161 87.0456 15.4705 87.0456 14.7085V14.6297H89.4487V14.7674C89.4487 16.0281 89.0899 17.0233 88.3776 17.7529C87.6652 18.4824 86.6437 18.8471 85.323 18.8471C83.9368 18.8471 82.9537 18.3557 82.3748 17.3755C81.7959 16.3952 81.5051 14.9179 81.5051 12.9453V10.7154C81.5051 8.73158 81.809 7.2292 82.4143 6.21036C83.0196 5.19152 83.9985 4.68089 85.3489 4.68089C86.1716 4.68089 86.8686 4.84579 87.4388 5.17796C88.0089 5.51013 88.4375 6.00966 88.7235 6.67922C89.012 7.34879 89.1562 8.22264 89.1562 9.30089V11.2833H84.8657V13.8712ZM85.2232 7.96811C85.0797 8.14449 84.9857 8.43377 84.9363 8.83593C84.8892 9.2381 84.8657 9.84722 84.8657 10.6657V11.5641H86.2497V10.6657C86.2497 9.86133 86.2262 9.25221 86.1792 8.83593C86.1321 8.41966 86.0381 8.12803 85.8946 7.95635C85.7512 7.78702 85.5473 7.7 85.2797 7.7C85.0376 7.70235 84.8657 7.79172 84.2232 7.96811Z" fill="white"></path>
                </svg>
              </button>
              {/* Yellow border overlay */}
              <div className="absolute inset-0 border-2 border-[#FFE500] rounded pointer-events-none"></div>
            </div>
          </div>
          
          {/* Overlay to prevent interaction with YouTube buttons */}
          <div className="absolute inset-0 z-10 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60px, rgba(0,0,0,0) calc(100% - 60px), rgba(0,0,0,0.7) 100%)'
          }}></div>
          
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
      <Card className="w-full max-w-4xl mx-auto shadow-lg border border-muted bg-[#111827] text-white overflow-hidden relative">
        {/* Back to Course Button */}
        <div className="absolute top-4 left-4 z-20">
          <Button
            onClick={() => router.push(`/course/${params.id}`)}
            variant="outline"
            size="icon"
            className="bg-[#111827]/80 hover:bg-[#111827] border-gray-700 text-white rounded-full h-10 w-10 backdrop-blur-sm transition-all"
            aria-label="العودة إلى الكورس"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <CardHeader className="pb-2 border-b border-gray-700">
          <CardTitle className="text-2xl font-bold text-white">مشاهدة الفيديو</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-0">
          <div className="w-full">
            {videoElement}
          </div>
          <div className="space-y-3 p-6">
            <h3 className="text-xl font-semibold text-white">{videoData.title || "عنوان الفيديو غير متوفر"}</h3>
            <div className="flex flex-col sm:flex-row gap-2 text-sm text-gray-400">
              <span>تاريخ النشر: {videoData.date || "غير متوفر"}</span>
              <span className="hidden sm:inline">•</span>
              <span>عدد المشاهدات: {videoData.views || "غير متوفر"}</span>
              {completionDate && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-[#61B846]">تم الإكمال: {new Date(completionDate).toLocaleDateString('ar-EG')}</span>
                </>
              )}
            </div>
            <div className="border-t border-gray-700 my-4 pt-4">
              <p className="text-base text-gray-300 leading-relaxed">{videoData.description || "وصف الفيديو غير متوفر"}</p>
            </div>
            
            {/* Video Assignments Section */}
            {assignments && assignments.length > 0 && (
              <div className="border-t border-gray-700 my-4 pt-4">
                <h4 className="text-lg font-semibold text-white mb-3">الواجبات المتاحة</h4>
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors">
                      <div className="flex-1">
                        <h5 className="font-medium text-white">{assignment.title}</h5>
                        <p className="text-sm text-gray-400 mt-1">{assignment.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <span>نوع الواجب: {assignment.isMCQ ? "اختيار من متعدد" : "واجب عادي"}</span>
                          <span className="mx-2">•</span>
                          <span className={`${new Date(assignment.dueDate) < new Date() ? 'text-red-400' : 'text-green-400'}`}>
                            تاريخ التسليم: {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {assignment.hasSubmitted ? (
                          assignment.submission ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[#61B846] flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                تم التسليم
                              </span>
                              {assignment.submission.status === "GRADED" && (
                                <span className="text-sm mt-1">
                                  الدرجة: {assignment.submission.grade}/{assignment.passingScore}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-yellow-500 flex items-center">
                              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
                              قيد المراجعة
                            </span>
                          )
                        ) : (
                          <Button
                            onClick={() => router.push(`/course/${params.id}/video/${params.video}/assignment/${assignment.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded transition-colors"
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
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleCompleteVideo}
                disabled={completingVideo || videoCompleted || apiCompletionStatus}
                className="bg-[#61B846] hover:bg-[#61B846]/90 text-white px-8 py-6 text-lg rounded-lg transition-all shadow-md disabled:opacity-70 disabled:shadow-none"
              >
                {completingVideo ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2"></span>
                    جاري التحميل...
                  </>
                ) : videoCompleted || apiCompletionStatus ? (
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