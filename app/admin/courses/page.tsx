'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, ChevronDown, Plus, ArrowUp, ArrowDown } from 'lucide-react';

import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createAdminCourse,
  deleteAdminCourse,
  getAdminCourses,
  updateAdminCourse,
} from '@/services/adminCoursesService';
import {
  deleteVideo,
  getCourseVideos,
  reorderVideos,
} from '@/services/adminVideoService';
import { listAllAdminQuizzes } from '@/services/adminQuizService';
import { VideoUploadModal, type QuizOption } from '@/components/admin/VideoUploadModal';
import type { AdminCourse } from '@/types/admin';
import type { BunnyVideo } from '@/types/bunny';
import type { GradeEnum } from '@/types/api';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

const GRADE_LABEL: Record<string, string> = {
  FIRST_SECONDARY: 'الأول الثانوي',
  SECOND_SECONDARY: 'الثاني الثانوي',
  THIRD_SECONDARY: 'الثالث الثانوي',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')} دقيقة`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface CourseFormState {
  title: string;
  description: string;
  price: string;
  grade: GradeEnum | '';
  category: string;
}

const EMPTY_FORM: CourseFormState = { title: '', description: '', price: '', grade: '', category: '' };

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion open course slug
  const [openCourseSlug, setOpenCourseSlug] = useState<string | null>(null);
  const [courseVideosMap, setCourseVideosMap] = useState<Record<string, BunnyVideo[]>>({});
  const [videosLoadingMap, setVideosLoadingMap] = useState<Record<string, boolean>>({});

  // Video Upload Modal
  const [uploadingCourse, setUploadingCourse] = useState<AdminCourse | null>(null);
  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);

  // Course Dialog (Create / Edit)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [form, setForm] = useState<CourseFormState>(EMPTY_FORM);
  const [formBusy, setFormBusy] = useState(false);

  // Delete Course Confirm
  const [deletingCourse, setDeletingCourse] = useState<AdminCourse | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Delete Video Confirm
  const [deletingVideo, setDeletingVideo] = useState<{ courseSlug: string; video: BunnyVideo } | null>(null);
  const [deleteVideoBusy, setDeleteVideoBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCourses({ limit: 100 });
      setCourses(res.data);
      setTotal(res.meta.total);
    } catch {
      setError('تعذر تحميل الدورات.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadQuizzes = useCallback(async () => {
    try {
      const res = await listAllAdminQuizzes({ limit: 50 });
      setQuizzes(res.data.map((q) => ({ id: q.slug, title: q.title })));
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  const toggleCourseAccordion = async (c: AdminCourse) => {
    if (openCourseSlug === c.slug) {
      setOpenCourseSlug(null);
      return;
    }

    setOpenCourseSlug(c.slug);

    // Fetch videos if not already loaded
    if (!courseVideosMap[c.slug]) {
      setVideosLoadingMap((prev) => ({ ...prev, [c.slug]: true }));
      try {
        const vids = await getCourseVideos(c.slug);
        setCourseVideosMap((prev) => ({ ...prev, [c.slug]: vids }));
      } catch {
        toast.error('تعذر تحميل فيديوهات هذه الدورة.');
      } finally {
        setVideosLoadingMap((prev) => ({ ...prev, [c.slug]: false }));
      }
    }
  };

  const reloadVideos = async (courseSlug: string) => {
    try {
      const vids = await getCourseVideos(courseSlug);
      setCourseVideosMap((prev) => ({ ...prev, [courseSlug]: vids }));
    } catch {
      // ignore
    }
  };

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: AdminCourse) => {
    setEditingCourse(c);
    setForm({
      title: c.title,
      description: c.description || '',
      price: c.price != null ? String(c.price) : '',
      grade: (c.grade as GradeEnum) || '',
      category: c.category || '',
    });
    setDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.grade) {
      toast.error('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: form.price === '' ? 0 : Number(form.price),
      grade: form.grade,
      category: form.category.trim() || undefined,
    };

    setFormBusy(true);
    try {
      if (editingCourse) {
        await updateAdminCourse(editingCourse.slug, payload);
        toast.success('تم تحديث بيانات الدورة بنجاح.');
      } else {
        await createAdminCourse(payload);
        toast.success('تم إنشاء الدورة بنجاح.');
      }
      setDialogOpen(false);
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشلت العملية.');
    } finally {
      setFormBusy(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setDeleteBusy(true);
    try {
      await deleteAdminCourse(deletingCourse.slug);
      toast.success('تم حذف الدورة بنجاح.');
      setDeletingCourse(null);
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل حذف الدورة.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!deletingVideo) return;
    setDeleteVideoBusy(true);
    try {
      await deleteVideo(deletingVideo.video.slug);
      toast.success('تم حذف الفيديو بنجاح.');
      await reloadVideos(deletingVideo.courseSlug);
      setDeletingVideo(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل حذف الفيديو.');
    } finally {
      setDeleteVideoBusy(false);
    }
  };

  const handleReorder = async (courseSlug: string, vids: BunnyVideo[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= vids.length) return;

    const copy = [...vids];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);

    setCourseVideosMap((prev) => ({ ...prev, [courseSlug]: copy }));

    try {
      await reorderVideos(courseSlug, copy.map((v) => v.slug));
      toast.success('تم حفظ الترتيب الجديد.');
    } catch {
      toast.error('فشل حفظ ترتيب الفيديوهات.');
      void reloadVideos(courseSlug);
    }
  };

  const totalVideosCount = courses.reduce((acc, c) => acc + (c._count?.videos ?? 0), 0);

  return (
    <>
      <PageTitle title={adminTitle('الدورات والفيديوهات')} />
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-8 sm:py-8">
        {/* Header matching design */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold sm:text-xl text-brand-text">الدورات والفيديوهات</h1>
            <p className="mt-1 text-sm text-brand-muted">
              {courses.length} دورات · {totalVideosCount} فيديو
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            + دورة جديدة
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mt-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-4 text-xs font-semibold text-brand-accent">
            {error}
          </div>
        )}

        {/* Courses Accordion List matching design */}
        <div className="mt-5 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48 bg-brand-chip" />
                    <Skeleton className="h-3 w-32 bg-brand-chip" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-full bg-brand-chip" />
                </div>
              </div>
            ))
          ) : courses.length === 0 ? (
            <p className="py-12 text-center text-sm text-brand-muted">لا توجد دورات مضافة حالياً.</p>
          ) : (
            courses.map((c) => {
              const isOpen = openCourseSlug === c.slug;
              const vids = courseVideosMap[c.slug] || [];
              const vidsLoading = videosLoadingMap[c.slug] || false;
              const studentsCount = c._count?.enrollments ?? 0;
              const isFree = c.price === 0 || c.price == null;
              const priceText = isFree ? 'مجاني' : `${c.price} ج.م`;
              const gradeText = c.grade ? GRADE_LABEL[c.grade] || c.grade : 'عام';

              return (
                <div key={c.slug} className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-xs">
                  {/* Course Row Header */}
                  <div className="flex w-full flex-wrap items-center justify-between gap-2.5 p-3 sm:px-5 sm:py-4">
                    <button
                      type="button"
                      onClick={() => toggleCourseAccordion(c)}
                      className="flex flex-1 items-center justify-between gap-2.5 sm:gap-3 text-start outline-none"
                    >
                      <div>
                        <p className="text-sm sm:text-base font-bold text-brand-text">{c.title}</p>
                        <p className="mt-0.5 text-[11px] sm:text-xs text-brand-muted">
                          {gradeText} {c.category ? `· ${c.category}` : ''} · {formatDate(c.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-5 text-[11px] sm:text-xs">
                        <span className="hidden text-brand-muted-strong sm:inline">
                          {studentsCount.toLocaleString('ar-EG')} طالب
                        </span>
                        <span
                          className={
                            'rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 font-bold ' +
                            (isFree ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-primary/10 text-brand-primary')
                          }
                        >
                          {priceText}
                        </span>
                        <ChevronDown
                          className={'h-4 w-4 text-brand-muted transition-transform duration-200 ' + (isOpen ? 'rotate-180' : '')}
                        />
                      </div>
                    </button>

                    {/* Course Actions */}
                    <div className="flex items-center gap-2 border-s border-brand-border pe-1 ps-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="rounded-lg p-1 text-brand-muted-strong hover:bg-brand-hover hover:text-brand-primary"
                        title="تعديل الدورة"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCourse(c)}
                        className="rounded-lg p-1 text-brand-accent hover:bg-brand-hover"
                        title="حذف الدورة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Accordion Body */}
                  {isOpen && (
                    <div className="border-t border-brand-border bg-brand-bg/40 px-4 py-3 sm:px-5">
                      {vidsLoading ? (
                        <div className="space-y-2 py-3">
                          <Skeleton className="h-6 w-full bg-brand-chip" />
                          <Skeleton className="h-6 w-full bg-brand-chip" />
                        </div>
                      ) : vids.length === 0 ? (
                        <p className="py-4 text-center text-xs text-brand-muted">لا توجد فيديوهات في هذه الدورة بعد.</p>
                      ) : (
                        <div className="divide-y divide-brand-border">
                          {vids.map((v, idx) => (
                            <div key={v.slug} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                              <span className="font-medium text-brand-text">{v.title}</span>
                              <div className="flex items-center gap-3 text-xs text-brand-muted">
                                <span>{formatDuration(v.duration)}</span>
                                <span
                                  className={
                                    'rounded-full px-2 py-0.5 font-bold ' +
                                    (v.quizSlug ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-chip text-brand-muted')
                                  }
                                >
                                  {v.quizSlug ? 'به اختبار' : 'بدون اختبار'}
                                </span>
                                <div className="flex items-center gap-1 border-s border-brand-border ps-2">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleReorder(c.slug, vids, idx, -1)}
                                    className="p-0.5 text-brand-muted hover:text-brand-text disabled:opacity-30"
                                    title="تحريك لأعلى"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === vids.length - 1}
                                    onClick={() => handleReorder(c.slug, vids, idx, 1)}
                                    className="p-0.5 text-brand-muted hover:text-brand-text disabled:opacity-30"
                                    title="تحريك لأسفل"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingVideo({ courseSlug: c.slug, video: v })}
                                    className="p-0.5 text-brand-accent hover:opacity-80"
                                    title="حذف الفيديو"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setUploadingCourse(c)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        رفع فيديو جديد
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Video Upload Modal */}
      {uploadingCourse && (
        <VideoUploadModal
          courseSlug={uploadingCourse.slug}
          courseTitle={uploadingCourse.title}
          quizzes={quizzes}
          onClose={() => setUploadingCourse(null)}
          onSuccess={() => {
            void reloadVideos(uploadingCourse.slug);
            void load();
          }}
        />
      )}

      {/* Create / Edit Course Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-brand-surface border-brand-border">
          <DialogHeader>
            <DialogTitle className="text-brand-text font-bold">
              {editingCourse ? 'تعديل الدورة' : 'إنشاء دورة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-brand-text">عنوان الدورة *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثال: أساسيات الكيمياء العضوية"
                required
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">المرحلة الدراسية *</Label>
              <Select
                value={form.grade}
                onValueChange={(val) => setForm((f) => ({ ...f, grade: val as GradeEnum }))}
              >
                <SelectTrigger className="mt-1 bg-brand-bg border-brand-border">
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface border-brand-border">
                  <SelectItem value="FIRST_SECONDARY">الأول الثانوي</SelectItem>
                  <SelectItem value="SECOND_SECONDARY">الثاني الثانوي</SelectItem>
                  <SelectItem value="THIRD_SECONDARY">الثالث الثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">الفئة / التصنيف</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="مثال: كيمياء"
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">السعر (ج.م) — اتركه فارغاً أو 0 للمجاني</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0"
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">الوصف</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="وصف مختصر للدورة..."
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-start pt-2">
              <button
                type="submit"
                disabled={formBusy}
                className="rounded-full bg-brand-primary px-5 py-2 text-xs font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {formBusy ? 'جارٍ الحفظ...' : editingCourse ? 'حفظ التعديلات' : 'إنشاء الدورة'}
              </button>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-full border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted-strong hover:bg-brand-hover"
              >
                إلغاء
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirm */}
      <ConfirmDialog
        open={Boolean(deletingCourse)}
        title="تأكيد حذف الدورة"
        description={`هل أنت متأكد من حذف دورة "${deletingCourse?.title}"؟ سيتم حذف جميع الفيديوهات المرتبطة بها على Bunny.`}
        confirmLabel="حذف الدورة"
        busy={deleteBusy}
        variant="brand"
        onConfirm={handleDeleteCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
      />

      {/* Delete Video Confirm */}
      <ConfirmDialog
        open={Boolean(deletingVideo)}
        title="تأكيد حذف الفيديو"
        description={`هل أنت متأكد من حذف فيديو "${deletingVideo?.video.title}"؟ سيتم حذفه من سيرفرات Bunny نهائياً.`}
        confirmLabel="حذف الفيديو"
        busy={deleteVideoBusy}
        variant="brand"
        onConfirm={handleDeleteVideo}
        onOpenChange={(open) => !open && setDeletingVideo(null)}
      />
    </>
  );
}
