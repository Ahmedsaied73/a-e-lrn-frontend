'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2, BookOpen, XCircle } from 'lucide-react';

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
import { getAdminCourses } from '@/services/adminCoursesService';
import { adminEnrollStudent, adminUnenroll, getAdminEnrollments } from '@/services/adminEnrollmentsService';
import { deleteAdminUser, getAdminUsers, registerStudent, updateAdminUser } from '@/services/adminUsersService';
import type { AdminCourse, AdminEnrollment, AdminStudentInput, AdminUser } from '@/types/admin';
import type { GradeEnum } from '@/types/api';
import { PageTitle } from '@/components/page-title';
import { adminTitle } from '@/lib/page-titles';

const GRADE_LABEL: Record<string, string> = {
  FIRST_SECONDARY: 'الأول الثانوي',
  SECOND_SECONDARY: 'الثاني الثانوي',
  THIRD_SECONDARY: 'الثالث الثانوي',
};

const GRADE_REV_MAP: Record<string, GradeEnum> = {
  'الأول الثانوي': 'FIRST_SECONDARY',
  'الثاني الثانوي': 'SECOND_SECONDARY',
  'الثالث الثانوي': 'THIRD_SECONDARY',
};

function formatLastSeen(lastLogin: string | null | undefined, createdAt: string): string {
  const target = lastLogin || createdAt;
  if (!target) return '—';
  const d = new Date(target);
  if (Number.isNaN(d.getTime())) return '—';

  const diffMs = Date.now() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'الآن';
  if (diffHours < 24) return `منذ ${diffHours.toLocaleString('ar-EG')} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays.toLocaleString('ar-EG')} أيام`;
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

export default function AdminStudentsPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(16);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('الكل');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit student dialog
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGrade, setEditGrade] = useState<GradeEnum | ''>('');
  const [editPhone, setEditPhone] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  // Add student dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AdminStudentInput>({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    grade: 'FIRST_SECONDARY',
  });
  const [addBusy, setAddBusy] = useState(false);

  // Delete student dialog
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Per-student courses dialog (enroll / unenroll)
  const [courseUser, setCourseUser] = useState<AdminUser | null>(null);
  const [courseRows, setCourseRows] = useState<AdminEnrollment[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [allCourses, setAllCourses] = useState<AdminCourse[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState('');
  const [enrollBusy, setEnrollBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mappedGrade = gradeFilter !== 'الكل' ? GRADE_REV_MAP[gradeFilter] : undefined;
      const res = await getAdminUsers({
        page,
        limit: pageSize,
        role: 'STUDENT',
        grade: mappedGrade || undefined,
        search: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('تعذر تحميل بيانات الطلاب.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, gradeFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim() || !addForm.grade) {
      toast.error('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    setAddBusy(true);
    try {
      await registerStudent(addForm);
      toast.success('تمت إضافة الطالب بنجاح.');
      setAddOpen(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        phoneNumber: '',
        grade: 'FIRST_SECONDARY',
      });
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل إضافة الطالب.');
    } finally {
      setAddBusy(false);
    }
  };

  const handleEditOpen = (u: AdminUser) => {
    setEditing(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditGrade((u.grade as GradeEnum) || '');
    setEditPhone(u.phoneNumber || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    try {
      await updateAdminUser(editing.slug, {
        name: editName.trim(),
        email: editEmail.trim(),
        grade: editGrade || undefined,
        phoneNumber: editPhone.trim() || undefined,
      });
      toast.success('تم تحديث بيانات الطالب.');
      setEditing(null);
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل تحديث بيانات الطالب.');
    } finally {
      setEditBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteAdminUser(deleting.slug);
      toast.success('تم حذف الطالب بنجاح.');
      setDeleting(null);
      void load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل حذف الطالب.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const openCourseManager = async (u: AdminUser) => {
    setCourseUser(u);
    setCourseLoading(true);
    setSelectedCourseSlug('');
    try {
      const [enrollRes, coursesRes] = await Promise.all([
        getAdminEnrollments({ userSlug: u.slug, limit: 100 }),
        getAdminCourses({ limit: 100 }),
      ]);
      setCourseRows(enrollRes.data);
      setAllCourses(coursesRes.data);
    } catch {
      toast.error('تعذر تحميل بيانات اشتراكات الطالب.');
    } finally {
      setCourseLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!courseUser || !selectedCourseSlug) return;
    setEnrollBusy(true);
    try {
      await adminEnrollStudent(courseUser.slug, selectedCourseSlug);
      toast.success('تم تسجيل الطالب في الدورة بنجاح.');
      setSelectedCourseSlug('');
      const enrollRes = await getAdminEnrollments({ userSlug: courseUser.slug, limit: 100 });
      setCourseRows(enrollRes.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل تسجيل الطالب.');
    } finally {
      setEnrollBusy(false);
    }
  };

  const handleUnenroll = async (enrollmentId: number) => {
    try {
      await adminUnenroll(enrollmentId);
      toast.success('تم إلغاء الاشتراك بنجاح.');
      if (courseUser) {
        const enrollRes = await getAdminEnrollments({ userSlug: courseUser.slug, limit: 100 });
        setCourseRows(enrollRes.data);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل إلغاء الاشتراك.');
    }
  };

  return (
    <>
      <PageTitle title={adminTitle('الطلاب')} />
      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-8 sm:py-8">
        {/* Header matching design */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold sm:text-xl text-brand-text">الطلاب</h1>
            <p className="mt-1 text-sm text-brand-muted">
              {total.toLocaleString('ar-EG')} طالب مسجل على المنصة
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            + إضافة طالب
          </button>
        </div>

        {/* Search & Grade Filter Buttons matching design */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث بالاسم أو البريد…"
            className="w-full max-w-xs rounded-full border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text outline-none transition focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
          />
          {['الكل', 'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGradeFilter(g);
                setPage(1);
              }}
              className={
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ' +
                (gradeFilter === g
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-brand-border bg-brand-surface text-brand-muted-strong hover:bg-brand-hover')
              }
            >
              {g}
            </button>
          ))}
        </div>

        {/* Error alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-4 text-xs font-semibold text-brand-accent">
            {error}
          </div>
        )}

        {/* Student Cards Grid matching design */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl border border-brand-border bg-brand-surface p-3 sm:p-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Skeleton className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-brand-chip" />
                  <div className="flex-1 space-y-1.5 sm:space-y-2">
                    <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-28 bg-brand-chip" />
                    <Skeleton className="h-2.5 sm:h-3 w-32 sm:w-40 bg-brand-chip" />
                  </div>
                </div>
                <Skeleton className="mt-3 sm:mt-4 h-2 w-full bg-brand-chip" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-brand-muted">
              لا يوجد طلاب مطابقين لبحثك.
            </p>
          ) : (
            rows.map((s) => {
              const gradeText = s.grade ? GRADE_LABEL[s.grade] || s.grade : '—';
              const lastSeenText = formatLastSeen(s.lastLoginAt, s.createdAt);

              return (
                <div key={s.id} className="rounded-xl sm:rounded-2xl border border-brand-border bg-brand-surface p-3 sm:p-4 shadow-xs transition hover:border-brand-primary/30">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="grid h-9 w-9 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-full bg-brand-secondary/20 text-xs sm:text-sm font-bold text-brand-secondary">
                      {s.name.slice(0, 1) || 'ط'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs sm:text-sm font-bold text-brand-text">{s.name}</p>
                      <p className="truncate text-[11px] sm:text-xs text-brand-muted">{s.email}</p>
                      {s.phoneNumber && (
                        <p className="truncate text-[10px] sm:text-[11px] text-brand-muted-strong" dir="ltr">{s.phoneNumber}</p>
                      )}
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-brand-chip px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-brand-muted-strong">
                      {gradeText}
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-brand-border pt-3 text-xs text-brand-muted">
                    <span>آخر ظهور: {lastSeenText}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openCourseManager(s)}
                        className="inline-flex items-center gap-1 font-bold text-brand-primary hover:underline"
                        title="إدارة الدورات"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        الدورات
                      </button>
                      <span className="text-brand-border">•</span>
                      <button
                        type="button"
                        onClick={() => handleEditOpen(s)}
                        className="font-bold text-brand-muted-strong hover:text-brand-primary hover:underline"
                        title="تعديل البيانات"
                      >
                        تعديل
                      </button>
                      <span className="text-brand-border">•</span>
                      <button
                        type="button"
                        onClick={() => setDeleting(s)}
                        className="font-bold text-brand-accent hover:underline"
                        title="حذف الطالب"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-text disabled:opacity-40"
            >
              السابق
            </button>
            <span className="text-xs text-brand-muted">
              صفحة {page} من {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-text disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        )}
      </main>

      {/* Add Student Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md bg-brand-surface border-brand-border">
          <DialogHeader>
            <DialogTitle className="text-brand-text font-bold">إضافة طالب جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-brand-text">الاسم الكامل *</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="أحمد محمد"
                required
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="student@example.com"
                required
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">كلمة المرور المؤقتة *</Label>
              <Input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">المرحلة الدراسية *</Label>
              <Select
                value={addForm.grade}
                onValueChange={(val) => setAddForm((f) => ({ ...f, grade: val as GradeEnum }))}
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
              <Label className="text-xs font-semibold text-brand-text">رقم الهاتف (اختياري)</Label>
              <Input
                type="tel"
                value={addForm.phoneNumber || ''}
                onChange={(e) => setAddForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                placeholder="010XXXXXXXX"
                className="mt-1 bg-brand-bg border-brand-border"
                dir="ltr"
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-start pt-2">
              <button
                type="submit"
                disabled={addBusy}
                className="rounded-full bg-brand-primary px-5 py-2 text-xs font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {addBusy ? 'جارٍ الإضافة...' : 'إضافة الطالب'}
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-full border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted-strong hover:bg-brand-hover"
              >
                إلغاء
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md bg-brand-surface border-brand-border">
          <DialogHeader>
            <DialogTitle className="text-brand-text font-bold">تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-brand-text">الاسم الكامل</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">البريد الإلكتروني</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className="mt-1 bg-brand-bg border-brand-border"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-brand-text">المرحلة الدراسية</Label>
              <Select
                value={editGrade}
                onValueChange={(val) => setEditGrade(val as GradeEnum)}
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
              <Label className="text-xs font-semibold text-brand-text">رقم الهاتف</Label>
              <Input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="mt-1 bg-brand-bg border-brand-border"
                dir="ltr"
              />
            </div>
            <DialogFooter className="gap-2 sm:justify-start pt-2">
              <button
                type="submit"
                disabled={editBusy}
                className="rounded-full bg-brand-primary px-5 py-2 text-xs font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {editBusy ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted-strong hover:bg-brand-hover"
              >
                إلغاء
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Student Confirmation */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="تأكيد حذف الطالب"
        description={`هل أنت متأكد من حذف الطالب "${deleting?.name}"؟ سيتم حذف جميع تسجيلاته ودرجاته نهائياً.`}
        confirmLabel="حذف الطالب"
        busy={deleteBusy}
        variant="brand"
        onConfirm={handleDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />

      {/* Per-student courses dialog */}
      <Dialog open={Boolean(courseUser)} onOpenChange={(open) => !open && setCourseUser(null)}>
        <DialogContent className="max-w-lg bg-brand-surface border-brand-border">
          <DialogHeader>
            <DialogTitle className="text-brand-text font-bold">
              دورات الطالب: {courseUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Quick enroll */}
            <div className="flex gap-2">
              <Select value={selectedCourseSlug} onValueChange={setSelectedCourseSlug}>
                <SelectTrigger className="flex-1 bg-brand-bg border-brand-border">
                  <SelectValue placeholder="اختر دورة لتسجيل الطالب فيها" />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface border-brand-border">
                  {allCourses
                    .filter((c) => !courseRows.some((er) => er.course.slug === c.slug))
                    .map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                disabled={!selectedCourseSlug || enrollBusy}
                onClick={handleEnroll}
                className="rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
              >
                تسجيل
              </button>
            </div>

            {/* Current enrollments */}
            <div className="max-h-60 overflow-y-auto divide-y divide-brand-border rounded-xl border border-brand-border bg-brand-bg p-2">
              {courseLoading ? (
                <p className="py-4 text-center text-xs text-brand-muted">جارٍ تحميل الدورات...</p>
              ) : courseRows.length === 0 ? (
                <p className="py-4 text-center text-xs text-brand-muted">الطالب غير مسجل في أي دورة حالياً.</p>
              ) : (
                courseRows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 px-1">
                    <div>
                      <p className="text-xs font-bold text-brand-text">{r.course.title}</p>
                      <p className="text-[11px] text-brand-muted">
                        التقدم: {r.progress != null ? `${r.progress}%` : '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnenroll(r.id)}
                      className="text-xs font-bold text-brand-accent hover:underline"
                    >
                      إلغاء الاشتراك
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}