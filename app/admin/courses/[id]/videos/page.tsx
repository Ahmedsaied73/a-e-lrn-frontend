'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Film, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
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

  const renderRow = (video: BunnyVideo, index: number) => (
    <div key={video.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
        <Film className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-100">{video.title}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          #{video.position ?? '—'} · {formatDuration(video.duration)}
          {video.status === 'PROCESSING' && video.processingProgress != null ? ` · ${video.processingProgress}%` : ''}
        </p>
        {video.status === 'FAILED' && video.failureReason && (
          <p className="mt-1 truncate text-[11px] text-red-400" title={video.failureReason}>سبب الفشل: {video.failureReason}</p>
        )}
      </div>
      <StatusBadge status={video.status} className="shrink-0" />
      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" title="لأعلى" disabled={index === 0} onClick={() => void doReorder(index, -1)} className="rounded-lg border border-slate-600 p-2 text-slate-300 transition-colors duration-150 hover:border-slate-400 hover:text-slate-100 disabled:opacity-30">
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="لأسفل" disabled={index === videos.length - 1} onClick={() => void doReorder(index, 1)} className="rounded-lg border border-slate-600 p-2 text-slate-300 transition-colors duration-150 hover:border-slate-400 hover:text-slate-100 disabled:opacity-30">
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        {isReUploadable(video.status) && (
          <button type="button" title="إعادة الرفع" onClick={() => setUploadingFor(video)} className="rounded-lg border border-amber-500/40 p-2 text-amber-300 transition-colors duration-150 hover:border-amber-400 hover:text-amber-200">
            <Upload className="h-3.5 w-3.5" />
          </button>
        )}
        {isEditableStatus(video.status) && (
          <button type="button" title="رفع / إعادة رفع" onClick={() => setUploadingFor(video)} className="rounded-lg border border-emerald-500/40 p-2 text-emerald-300 transition-colors duration-150 hover:border-emerald-400 hover:text-emerald-200">
            <Upload className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" title="حذف" onClick={() => setDeleting(video)} className="rounded-lg border border-red-500/40 p-2 text-red-300 transition-colors duration-150 hover:border-red-400 hover:text-red-200">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={() => router.push('/admin/courses')} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-200">
            <ChevronRight className="h-4 w-4" />
            العودة إلى الدورات
          </button>
          <h1 className="text-2xl font-bold text-slate-100">فيديوهات الدورة</h1>
          <p className="mt-1 text-sm text-slate-400">إدارة فيديوهات الدورة #{courseId} — {videos.length} فيديو.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => void load()}>
            <RefreshCw className="mr-0 h-4 w-4" />
            تحديث
          </Button>
          <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-0 h-4 w-4" />
            فيديو جديد
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm font-semibold text-red-300">{error}</p>}

      {bpLabel && (
        <Card className="border-slate-700/60 bg-card">
          <CardContent className="pt-5">
            <div className="mb-2 text-sm text-slate-300">{bpLabel}</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/60">
              <div className="h-full bg-emerald-500 transition-all duration-200" style={{ width: `${bp}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="border-slate-700/60 bg-card">
          <CardContent className="space-y-3 pt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-700/60 bg-slate-800/40" />
            ))}
          </CardContent>
        </Card>
      ) : videos.length === 0 ? (
        <Card className="border-slate-700/60 bg-card text-center">
          <CardContent className="py-12">
            <Film className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">لا توجد فيديوهات في هذه الدورة بعد.</p>
            <p className="mt-1 text-xs text-slate-500">أنشئ فيديو ثم ارفع ملفًا إليه.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-700/60 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-200">قائمة الفيديوهات ({videos.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">{videos.map(renderRow)}</CardContent>
        </Card>
      )}

      {/* create video */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="border-slate-700/60 bg-card text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">فيديو جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="video-title" className="text-slate-200">عنوان الفيديو *</Label>
            <Input id="video-title" dir="rtl" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="border-slate-700 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => setCreateOpen(false)} disabled={createBusy}>إلغاء</Button>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={() => void doCreate()} disabled={createBusy || !newTitle.trim()}>
              {createBusy ? 'جارٍ الإنشاء...' : 'إنشاء الفيديو'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* upload video */}
      <Dialog open={uploadingFor !== null} onOpenChange={(o) => { if (!o && !uploadBusy) { setUploadingFor(null); setSelectedFile(null); } }}>
        <DialogContent className="border-slate-700/60 bg-card text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">رفع ملف الفيديو</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-300">الفيديو: <span className="font-semibold text-slate-100">{uploadingFor?.title}</span></p>
            <div className="space-y-1.5">
              <Label className="text-slate-200">اختر ملف الفيديو</Label>
              <input
                type="file"
                accept="video/mp4,video/mov,video/x-matroska,video/avi,video/webm,.mp4,.mov,.mkv,.avi,.webm"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border file:border-slate-600 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200 file:hover:bg-slate-700"
              />
              <p className="text-[11px] text-slate-500">الصيغ المسموحة: mp4, mov, mkv, avi, webm.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => { setUploadingFor(null); setSelectedFile(null); }} disabled={uploadBusy}>إلغاء</Button>
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" onClick={() => void doUpload()} disabled={uploadBusy || !selectedFile}>
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
