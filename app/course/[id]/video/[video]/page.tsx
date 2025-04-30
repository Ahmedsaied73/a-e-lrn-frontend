"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function VideoPage({ params }: { params: { id: string; video: string } }) {
  const [videoData, setVideoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [params.video]);

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
          <div>{videoElement}</div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-primary-foreground">{videoData.title || "عنوان الفيديو غير متوفر"}</h3>
            <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
              <span>تاريخ النشر: {videoData.date || "غير متوفر"}</span>
              <span>عدد المشاهدات: {videoData.views || "غير متوفر"}</span>
            </div>
            <p className="text-base text-card-foreground leading-relaxed">{videoData.description || "وصف الفيديو غير متوفر"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}