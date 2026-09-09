'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, FileQuestion, Film, Plus, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createVideo,
  deleteVideo,
  getCourseVideos,
  reorderVideos,
  uploadVideo,
} from '@/services/adminVideoService';
import type { BunnyVideo } from '@/types/bunny';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AdminCourseVideosPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = Number(params.id);

  const [videos, setVideos] = useState<BunnyVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bp, setBp] = useState(0);
  const [bpLabel, setBpLabel] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  // upload dialog (per video)
  const [uploadingFor, setUploadingFor] = useState<BunnyVideo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [deleting, setDeleting] = useState<BunnyVideo | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const vids = await getCourseVideos(courseId);
      setVideos(vids);
    } catch {
      setError('تعذر تحميل الفيديوهات.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const doCreate = async () => {
    if (!newTitle.trim()) return;
    setCreateBusy(true);
    try {
      const created = await createVideo(courseId, newTitle.trim());
      toast.success('تم إنشاء الفيديو. يمكنك الآن رفع الملف.');
      setCreateOpen(false);
      setNewTitle('');
      void load();
      setUploadingFor({ ...created, courseId, status: 'PENDING' } as unknown as BunnyVideo);
    } catch {
      toast.error('فشل إنشاء الفيديو.');
    } finally {
      setCreateBusy(false);
    }
  };

  const doUpload = async () => {
    if (!uploadingFor || !selectedFile) return;
    const allowed = ['video/mp4', 'video/mov', 'video/x-matroska', 'video/avi', 'video/webm', 'application/mp4'];
    const ok = allowed.some((t) => (selectedFile.type ? selectedFile.type === t : /\.(mp4|mov|mkv|avi|webm)$/i.test(selectedFile.name)));
    if (!ok) {
      toast.error('صيغة غير مدعومة. الصيغ المسموحة: mp4, mov, mkv, avi, webm.');
      return;
    }
    setUploadBusy(true);
    setBpLabel('جارٍ رفع الملف إلى Bunny...');
    try {
      const res = await uploadVideo(uploadingFor.id, selectedFile);
      toast.success(res.message || 'تم رفع الفيديو بنجاح.');
      setUploadingFor(null);
      setSelectedFile(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل رفع الفيديو.');
      setBp(0);
      setBpLabel('');
    } finally {
      setUploadBusy(false);
    }
  };

  const doReorder = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= videos.length) return;
    const swap = videos[index];
    const next = [...videos];
    next[index] = next[target];
    next[target] = swap;
    try {
      await reorderVideos(courseId, next.map((v) => v.id));
      setVideos(next);
      toast.success('تم تحديث الترتيب.');
    } catch {
      toast.error('فشل تحديث الترتيب.');
      void load();
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteVideo(deleting.id);
      toast.success('تم حذف الفيديو.');
      setDeleting(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'تعذر حذف الفيديو.');
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const isEditableStatus = (s: string) => s === 'PENDING' || s === 'READY';
  const isReUploadable = (s: string) => s === 'FAILED';

  const visibleVideos = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => v.title.toLowerCase().includes(q));
  }, [videos, searchInput]);
  const showSearch = videos.length > 0;

  const renderRow = (video: BunnyVideo, index: number) => (
    <div key={video.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/70 bg-surface p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
        <Film className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-on-surface">{video.title}</p>
        <p className="mt-0.5 text-[11px] text-on-surface-variant/70">
          #{video.position ?? '—'} · {formatDuration(video.duration)}
          {video.status === 'PROCESSING' && video.processingProgress != null ? ` · ${video.processingProgress}%` : ''}
        </p>
        {video.status === 'FAILED' && video.failureReason && (
          <p className="mt-1 truncate text-[11px] text-red-600" title={video.failureReason}>سبب الفشل: {video.failureReason}</p>
        )}
      </div>
      <StatusBadge status={video.status} className="shrink-0" />
      {!video.quiz && (
        <span title="هذه المحاضرة بلا اختبار — الطلاب يتقدمون بمجرد المشاهدة" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          بدون اختبار
        </span>
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" title="لأعلى" disabled={index === 0} onClick={() => void doReorder(index, -1)} className="rounded-lg border border-outline-variant p-2 text-on-surface-variant transition-colors duration-150 hover:border-[#207bff] hover:text-on-surface disabled:opacity-30">
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="لأسفل" disabled={index === videos.length - 1} onClick={() => void doReorder(index, 1)} className="rounded-lg border border-outline-variant p-2 text-on-surface-variant transition-colors duration-150 hover:border-[#207bff] hover:text-on-surface disabled:opacity-30">
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        {isReUploadable(video.status) && (
          <button type="button" title="إعادة الرفع" onClick={() => setUploadingFor(video)} className="rounded-lg border border-amber-200 p-2 text-amber-600 transition-colors duration-150 hover:border-amber-400 hover:bg-amber-50">
            <Upload className="h-3.5 w-3.5" />
          </button>
        )}
        {isEditableStatus(video.status) && (
          <button type="button" title="رفع / إعادة رفع" onClick={() => setUploadingFor(video)} className="rounded-lg border border-emerald-200 p-2 text-emerald-600 transition-colors duration-150 hover:border-emerald-400 hover:bg-emerald-50">
            <Upload className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" title="اختبار الفيديو" onClick={() => router.push(`/admin/quizzes/${video.id}`)} className="rounded-lg border border-sky-500/40 p-2 text-sky-700 transition-colors duration-150 hover:border-sky-400 hover:text-sky-200">
          <FileQuestion className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="حذف" onClick={() => setDeleting(video)} className="rounded-lg border border-red-200 p-2 text-red-600 transition-colors duration-150 hover:border-red-400 hover:bg-red-50">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={() => router.push('/admin/courses')} className="mb-2 inline-flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-on-surface/80">
            <ChevronRight className="h-4 w-4" />
            العودة إلى الدورات
          </button>
          <h1 className="text-2xl font-bold text-on-surface">فيديوهات الدورة</h1>
          <p className="mt-1 text-sm text-on-surface-variant">إدارة فيديوهات الدورة #{courseId} — {videos.length} فيديو.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-[#207bff] hover:text-on-surface" onClick={() => void load()}>
            <RefreshCw className="mr-0 h-4 w-4" />
            تحديث
          </Button>
          <Button className="bg-[#207bff] text-white hover:bg-[#0057c0]" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-0 h-4 w-4" />
            فيديو جديد
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      {bpLabel && (
        <Card className="border-outline-variant/70 bg-card">
          <CardContent className="pt-5">
            <div className="mb-2 text-sm text-on-surface-variant">{bpLabel}</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6e8eb]">
              <div className="h-full bg-[#4ea5ff] transition-all duration-200" style={{ width: `${bp}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="border-outline-variant/70 bg-card">
          <CardContent className="space-y-3 pt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-outline-variant/70 bg-muted" />
            ))}
          </CardContent>
        </Card>
      ) : videos.length === 0 ? (
        <Card className="border-outline-variant/70 bg-card text-center">
          <CardContent className="py-12">
            <Film className="mx-auto h-10 w-10 text-outline" />
            <p className="mt-3 text-sm text-on-surface-variant">لا توجد فيديوهات في هذه الدورة بعد.</p>
            <p className="mt-1 text-xs text-on-surface-variant/70">أنشئ فيديو ثم ارفع ملفًا إليه.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-outline-variant/70 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-on-surface/80">قائمة الفيديوهات ({visibleVideos.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {showSearch && (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
                <Input
                  dir="rtl"
                  placeholder="ابحث باسم الفيديو..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="border-outline-variant bg-white pr-9 text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#207bff] focus:ring-2 focus:ring-[#207bff]/20"
                />
              </div>
            )}
            {visibleVideos.length === 0 ? (
              <p className="py-6 text-center text-sm text-on-surface-variant/70">لا توجد فيديوهات مطابقة للبحث.</p>
            ) : visibleVideos.map(renderRow)}
          </CardContent>
        </Card>
      )}

      {/* create video */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="border-outline-variant/70 bg-card text-on-surface">
          <DialogHeader>
            <DialogTitle className="text-on-surface">فيديو جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="video-title" className="text-on-surface/80">عنوان الفيديو *</Label>
            <Input id="video-title" dir="rtl" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="border-outline-variant bg-white text-on-surface placeholder:text-on-surface-variant/70 focus:border-[#207bff] focus:ring-2 focus:ring-[#207bff]/20" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-[#207bff] hover:text-on-surface" onClick={() => setCreateOpen(false)} disabled={createBusy}>إلغاء</Button>
            <Button className="bg-[#207bff] text-white hover:bg-[#0057c0]" onClick={() => void doCreate()} disabled={createBusy || !newTitle.trim()}>
              {createBusy ? 'جارٍ الإنشاء...' : 'إنشاء الفيديو'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* upload video */}
      <Dialog open={uploadingFor !== null} onOpenChange={(o) => { if (!o && !uploadBusy) { setUploadingFor(null); setSelectedFile(null); } }}>
        <DialogContent className="border-outline-variant/70 bg-card text-on-surface">
          <DialogHeader>
            <DialogTitle className="text-on-surface">رفع ملف الفيديو</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">الفيديو: <span className="font-semibold text-on-surface">{uploadingFor?.title}</span></p>
            <div className="space-y-1.5">
              <Label className="text-on-surface/80">اختر ملف الفيديو</Label>
              <input
                type="file"
                accept="video/mp4,video/mov,video/x-matroska,video/avi,video/webm,.mp4,.mov,.mkv,.avi,.webm"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border file:border-outline-variant file:bg-surface file:px-3 file:py-2 file:text-on-surface file:hover:bg-[#e8f2ff]"
              />
              <p className="text-[11px] text-on-surface-variant/70">الصيغ المسموحة: mp4, mov, mkv, avi, webm.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-outline-variant text-on-surface/80 hover:border-[#207bff] hover:text-on-surface" onClick={() => { setUploadingFor(null); setSelectedFile(null); }} disabled={uploadBusy}>إلغاء</Button>
            <Button className="bg-[#207bff] text-white hover:bg-[#0057c0]" onClick={() => void doUpload()} disabled={uploadBusy || !selectedFile}>
              {uploadBusy ? 'جارٍ الرفع...' : 'رفع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title="حذف الفيديو"
        description={`هل أنت متأكد من حذف "${deleting?.title}"؟ سيتم حذف الفيديو من Bunny عن بُعد وسيُفقد تقدم الطلاب المرتبط به. لا يمكن التراجع عن هذه الخطوة.`}
        confirmLabel="حذف نهائيًا"
        busy={deleteBusy}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
