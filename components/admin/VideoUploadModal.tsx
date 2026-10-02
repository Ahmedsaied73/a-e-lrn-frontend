'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { createVideo, uploadVideo } from '@/services/adminVideoService';

export interface QuizOption {
  id: string | number;
  title: string;
}

export function VideoUploadModal({
  courseSlug,
  courseTitle,
  quizzes = [],
  onClose,
  onSuccess,
}: {
  courseSlug: string;
  courseTitle: string;
  quizzes?: QuizOption[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [quizId, setQuizId] = useState('none');
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function pickFile(file: File | undefined) {
    if (!file) return;
    const allowed = ['video/mp4', 'video/mov', 'video/x-matroska', 'video/avi', 'video/webm', 'application/mp4'];
    const ok = allowed.some((t) => (file.type ? file.type === t : /\.(mp4|mov|mkv|avi|webm)$/i.test(file.name)));
    if (!ok) {
      toast.error('صيغة غير مدعومة. الصيغ المسموحة: mp4, mov, mkv, avi, webm.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} م.ب`);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  }

  async function startUpload() {
    if (!selectedFile || !title.trim()) return;
    setErrorMsg(null);
    setProgress(5);

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev === null) return 5;
        if (prev >= 90) return prev;
        return Math.min(90, prev + Math.random() * 12 + 4);
      });
    }, 400);

    try {
      // 1. Create the pending video record
      const created = await createVideo(courseSlug, title.trim());

      // 2. Upload file to Bunny Stream
      await uploadVideo(created.slug, selectedFile);

      window.clearInterval(progressTimer);
      setProgress(100);
      setDone(true);
      onSuccess?.();
    } catch (err) {
      window.clearInterval(progressTimer);
      setProgress(null);
      const msg = err instanceof Error ? err.message : 'فشل رفع الفيديو إلى Bunny. يرجى المحاولة مرة أخرى.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  }

  const canUpload = Boolean(selectedFile) && title.trim().length > 0 && progress === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl">
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
                <path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-4 text-base font-bold text-brand-text">تم رفع الفيديو بنجاح</p>
            <p className="mt-1 text-sm text-brand-muted">
              &quot;{title}&quot; أُضيف إلى {courseTitle}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-full bg-brand-primary py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90"
            >
              تمام
            </button>
          </div>
        ) : (
          <>
            <p className="text-base font-bold text-brand-text">رفع فيديو جديد</p>
            <p className="mt-0.5 text-xs text-brand-muted">إلى دورة: {courseTitle}</p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={
                'mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ' +
                (dragOver ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:border-brand-primary/40')
              }
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand-muted">
                <path d="M12 16V4M12 4 7 9M12 4l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {fileName ? (
                <p className="text-sm font-semibold text-brand-text">
                  {fileName} <span className="text-brand-muted">· {fileSize}</span>
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-brand-text">اسحب الفيديو هنا أو اضغط للاختيار</p>
                  <p className="text-xs text-brand-muted">MP4 حتى ٢ جيجابايت</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>

            <label className="mt-4 block text-xs font-semibold text-brand-text">عنوان الفيديو</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مقدمة عن التفاعلات العضوية"
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary"
            />

            {quizzes.length > 0 && (
              <>
                <label className="mt-3 block text-xs font-semibold text-brand-text">ربط باختبار (اختياري)</label>
                <select
                  value={quizId}
                  onChange={(e) => setQuizId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary"
                >
                  <option value="none">بدون اختبار</option>
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </>
            )}

            {progress !== null && (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-brand-muted">
                  <span>جارٍ الرفع إلى Bunny Stream…</span>
                  <span>{Math.round(progress)}٪</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-chip">
                  <div className="h-full rounded-full bg-brand-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="mt-3 rounded-lg bg-brand-accent/10 px-3 py-2 text-xs font-semibold text-brand-accent">
                {errorMsg}
              </p>
            )}

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={progress !== null}
                className="flex-1 rounded-full border border-brand-border py-2.5 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-hover disabled:opacity-40"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={startUpload}
                disabled={!canUpload}
                className="flex-1 rounded-full bg-brand-primary py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-40"
              >
                رفع الفيديو
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
