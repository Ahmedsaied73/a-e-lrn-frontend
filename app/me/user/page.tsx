'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChartBar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  Loader2,
  Mail,
  Phone,
  Play,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectAuth } from '@/store/slices/authSlice';
import { getEnrolledCourses, fetchCourseById } from '@/services/courseService';
import type { CourseListItem, CourseDetail } from '@/services/courseService';
import { apiClient } from '@/lib/api-client';
import { FadeIn } from '@/components/animations';

const GRADE_LABELS: Record<string, string> = {
  FIRST_SECONDARY: 'الصف الأول الثانوي',
  SECOND_SECONDARY: 'الصف الثاني الثانوي',
  THIRD_SECONDARY: 'الصف الثالث الثانوي',
};

interface AssignmentRef {
  id: number;
  title: string;
  video: {
    id: number;
    title: string;
    courseId: number;
  };
}

interface SubmissionItem {
  id: number;
  assignmentId: number;
  status: string;
  grade: number;
  submittedAt: string;
  assignment: AssignmentRef;
}

interface ContinueItem {
  course: CourseListItem;
  video: { id: number; title: string; duration?: number; position?: number | null; thumbnail?: string };
  remaining: number;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatArabicDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds <= 0) return '0 دقيقة';
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} دقيقة`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} ساعة`;
  return `${hours} ساعة و ${minutes} دقيقة`;
}

export default function UserProfilePage() {
  const user = useAppSelector(selectUser);
  const { initialized, isAuthenticated } = useAppSelector(selectAuth);

  const [enrolledCourses, setEnrolledCourses] = useState<CourseListItem[]>([]);
  const [continueItem, setContinueItem] = useState<ContinueItem | null>(null);
  const [learnedEverything, setLearnedEverything] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      window.location.replace('/login');
    }
  }, [initialized, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        let courses: CourseListItem[] = [];
        try {
          courses = await getEnrolledCourses();
        } catch {
          courses = [];
        }
        if (cancelled) return;
        setEnrolledCourses(Array.isArray(courses) ? courses : []);

        if (courses.length > 0) {
          try {
            // fetchCourseById returns videos + progress in ONE request per course
            // (previously 2 requests per course: bunnyVideos + progress)
            const perCourse = await Promise.all(
              courses.map(async (course) => {
                try {
                  const detail = await fetchCourseById(course.id);
                  const doneIds = new Set(
                    (detail.progress ?? []).filter((v) => v.completed).map((v) => Number(v.videoId)),
                  );
                  return { course, videos: detail.videos ?? [], doneIds };
                } catch {
                  return { course, videos: [] as NonNullable<CourseDetail['videos']>, doneIds: new Set<number>() };
                }
              }),
            );

            let found: ContinueItem | null = null;
            for (const entry of perCourse) {
              // getCourseById already returns only READY videos, sorted by position
              const ready = (entry.videos || [])
                .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
              const completedInReady = ready.filter((v) => entry.doneIds.has(v.id)).length;
              const next = ready.find((v) => !entry.doneIds.has(v.id));
              if (next) {
                found = { course: entry.course, video: next, remaining: Math.max(0, ready.length - completedInReady) };
                break;
              }
            }
            if (cancelled) return;
            setContinueItem(found);
            setLearnedEverything(!found);
          } catch {
            setContinueItem(null);
            setLearnedEverything(false);
          }
        }

        try {
          const data = await apiClient.get<SubmissionItem[] | { submissions: SubmissionItem[] }>(
            '/assignments/user/submissions',
          );
          const list = Array.isArray(data) ? data : data?.submissions ?? [];
          if (cancelled) return;
          setSubmissions(Array.isArray(list) ? list : []);
        } catch {
          if (cancelled) return;
          setSubmissions([]);
        }
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    };

    if (initialized && isAuthenticated) {
      loadDashboard();
    } else {
      setIsDataLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [initialized, isAuthenticated]);

  const isLoading = !initialized;
  const gradeLabel = user?.grade ? GRADE_LABELS[user.grade] : undefined;
  const achievementsCount = submissions.filter((s) => s.status === 'GRADED').length;
  const nextLessonHref = continueItem
    ? `/course/${continueItem.course.id}/video/${continueItem.video.id}`
    : '/me/user/courses';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-on-surface-variant">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-6 lg:px-12">
        {/* Breadcrumbs */}
        <FadeIn>
        <nav className="flex items-center gap-2 text-[13px] font-medium text-on-surface-variant">
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-primary">
            <Home size={16} aria-hidden="true" />
            الرئيسية
          </Link>
          <ChevronRight size={14} className="rotate-180 text-outline" aria-hidden="true" />
          <span className="font-bold text-primary">ملف الطالب والإحصائيات</span>
        </nav>

        {/* Sub-header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">لوحة البيانات الأكاديمية والملف الشخصي</h1>
            <p className="mt-1 text-[15px] text-on-surface-variant">
              إليك ملخصًا شاملًا لأدائك الأكاديمي وتقدمك في الكورسات والمهام
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={nextLessonHref}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-xs transition-all hover:bg-on-primary-fixed-variant hover:shadow-md"
            >
              <Play size={16} fill="currentColor" aria-hidden="true" />
              متابعة آخر محاضرة
            </Link>
            <Link
              href="/me/user/achievements"
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              <ChartBar size={16} aria-hidden="true" />
              تقرير الأداء الشامل
            </Link>
          </div>
        </div>
        </FadeIn>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ── Left sidebar ── */}
          <aside className="flex flex-col gap-6 lg:col-span-4 xl:col-span-3">
            {/* Profile card */}
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="primary-gradient flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-on-primary shadow-md">
                    {user?.name ? getInitials(user.name) : 'مس'}
                  </div>
                  <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-surface-container-lowest bg-emerald-500" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <h2 className="text-xl font-bold text-on-surface">{user?.name || 'المستخدم'}</h2>
                  <BadgeCheck size={18} className="text-primary" aria-hidden="true" />
                </div>
                <p className="mt-1 text-[13px] font-medium text-on-surface-variant">
                  {gradeLabel || (user?.role === 'ADMIN' ? 'مشرف على المنصة' : 'طالب')}
                </p>
              </div>

              <div className="my-5 border-t border-outline-variant/60" />

              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <Mail size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-on-surface-variant">البريد الإلكتروني</p>
                    <p dir="ltr" className="truncate text-left text-[13px] font-semibold text-on-surface">
                      {user?.email || 'غير متوفر'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <Phone size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-on-surface-variant">رقم الهاتف</p>
                    <p dir="ltr" className="truncate text-left text-[13px] font-semibold text-on-surface">
                      {user?.phoneNumber || 'غير متوفر'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <CalendarDays size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-on-surface-variant">تاريخ الانضمام</p>
                    <p className="text-[13px] font-semibold text-on-surface">
                      {user?.createdAt ? formatArabicDate(user.createdAt) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <ShieldCheck size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-on-surface-variant">حالة الحساب</p>
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      نشط
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account nav */}
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-xs">
              <nav className="flex flex-col gap-1">
                <Link
                  href="/me/user"
                  className="flex items-center gap-3 rounded-xl border-r-[3px] border-r-primary bg-primary/10 px-4 py-3 transition-colors"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
                    <LayoutDashboard size={17} aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-[14px] font-bold text-primary">ملف المستخدم العام</span>
                  <span className="text-[11px] font-bold text-primary">عرض</span>
                </Link>
                <Link
                  href="/me/user/courses"
                  className="group flex items-center gap-3 rounded-xl border-r-[3px] border-r-transparent px-4 py-3 transition-colors hover:bg-surface-container-low"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                    <BookOpen size={17} aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-[14px] font-semibold text-on-surface transition-colors group-hover:text-primary">
                    كورساتي والمناهج المسجلة
                  </span>
                  {enrolledCourses.length > 0 && (
                    <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-bold text-on-surface-variant">
                      {enrolledCourses.length}
                    </span>
                  )}
                </Link>
                <Link
                  href="/me/user/subscriptions"
                  className="group flex items-center gap-3 rounded-xl border-r-[3px] border-r-transparent px-4 py-3 transition-colors hover:bg-surface-container-low"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                    <ShoppingBag size={17} aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-[14px] font-semibold text-on-surface transition-colors group-hover:text-primary">
                    الاشتراكات والفواتير
                  </span>
                </Link>
                <Link
                  href="/me/user/achievements"
                  className="group flex items-center gap-3 rounded-xl border-r-[3px] border-r-transparent px-4 py-3 transition-colors hover:bg-surface-container-low"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                    <Trophy size={17} aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-[14px] font-semibold text-on-surface transition-colors group-hover:text-primary">
                    الإنجازات والنتائج
                  </span>
                  {achievementsCount > 0 && (
                    <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-bold text-on-surface-variant">
                      {achievementsCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>
          </aside>

          {/* ── Main column ── */}
          <section className="flex flex-col gap-6 lg:col-span-8 xl:col-span-9">
            {/* Welcome card */}
            <FadeIn>
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs">
              <div className="dot-grid-bg absolute inset-0 opacity-60" aria-hidden="true" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[20px] font-bold text-on-surface">
                    <Sparkles size={20} className="text-primary" aria-hidden="true" />
                    مرحبًا بك مجددًا
                    <span aria-hidden="true">👋</span>
                  </h2>
                  <p className="mt-1 text-[14px] text-on-surface-variant">
                    سعدنا بعودتك إلى فضاء التعلم الخاص بك، تابع من حيث توقفت
                  </p>
                </div>
                {gradeLabel && (
                  <span className="self-start rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary md:self-auto">
                    {gradeLabel}
                  </span>
                )}
              </div>
            </div>
            </FadeIn>

            {/* Continue learning */}
            <FadeIn>
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-on-surface">
                  <PlayCircle size={19} className="text-primary" aria-hidden="true" />
                  متابعة التعلّم الحالي
                </h3>
                <Link href="/me/user/courses" className="text-[13px] font-bold text-primary hover:underline">
                  عرض الكل
                </Link>
              </div>

              {isDataLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-on-surface-variant">
                  <Loader2 size={16} className="animate-spin text-primary" aria-hidden="true" />
                  جاري تحميل حالة التقدم...
                </div>
              ) : learnedEverything && enrolledCourses.length > 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-600" aria-hidden="true" />
                  <p className="mt-3 text-[15px] font-bold text-emerald-700">أكملت جميع محاضرات الكورسات</p>
                  <p className="mt-1 text-[13px] text-emerald-700/80">لا توجد محاضرات متبقية حاليًا</p>
                  <Link
                    href="/me/user/courses"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-emerald-700"
                  >
                    استعراض كورساتي
                  </Link>
                </div>
              ) : continueItem ? (
                <div className="flex flex-col gap-4">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-[12px] font-semibold text-on-surface-variant">
                    <GraduationCap size={14} className="text-primary" aria-hidden="true" />
                    {continueItem.course.title}
                  </span>
                  <div className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-xs">
                        <Play size={18} fill="currentColor" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-[12px] font-medium text-on-surface-variant">المحاضرة التالية</p>
                        <h4 className="mt-0.5 text-[15px] font-bold text-on-surface">{continueItem.video.title}</h4>
                        {continueItem.video.duration != null && (
                          <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-on-surface-variant">
                            <Clock size={13} aria-hidden="true" />
                            {formatDuration(continueItem.video.duration)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[12px] font-semibold text-primary">
                        متبقي {continueItem.remaining} محاضرة في هذا الكورس
                      </p>
                      <Link
                        href={`/course/${continueItem.course.id}/video/${continueItem.video.id}`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-xs transition-colors hover:bg-on-primary-fixed-variant"
                      >
                        استكمال الدرس الآن
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface p-6 text-center">
                  <BookOpen size={28} className="mx-auto text-outline" aria-hidden="true" />
                  <p className="mt-3 text-[14px] font-bold text-on-surface">لا توجد كورسات مسجلة بعد</p>
                  <p className="mt-1 text-[12px] text-on-surface-variant">اشترك في كورس لتبدأ رحلة التعلم</p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
                  >
                    استكشف الكورسات
                  </Link>
                </div>
              )}
            </div>
            </FadeIn>

            {/* Recent assignments */}
            <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-on-surface">
                  <FileText size={19} className="text-primary" aria-hidden="true" />
                  المهام والواجبات الأخيرة
                </h3>
                <Link href="/me/user/assignments" className="text-[13px] font-bold text-primary hover:underline">
                  عرض الكل
                </Link>
              </div>

              {isDataLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-on-surface-variant">
                  <Loader2 size={16} className="animate-spin text-primary" aria-hidden="true" />
                  جاري تحميل الواجبات...
                </div>
              ) : submissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface p-6 text-center">
                  <Clock size={28} className="mx-auto text-outline" aria-hidden="true" />
                  <p className="mt-3 text-[14px] font-bold text-on-surface">لا توجد واجبات مسلّمة بعد</p>
                  <p className="mt-1 text-[12px] text-on-surface-variant">قم بحل واجبات الكورسات لتظهر هنا</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {submissions.slice(0, 3).map((item) => {
                    const isGraded = item.status === 'GRADED';
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isGraded ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {isGraded ? <CheckCircle2 size={19} aria-hidden="true" /> : <Clock size={19} aria-hidden="true" />}
                          </span>
                          <div>
                            <p className="text-[14px] font-bold text-on-surface">{item.assignment.title}</p>
                            <p className="mt-0.5 text-[12px] font-medium text-on-surface-variant">
                              {isGraded ? `تم تقييمه — ${item.grade}` : 'قيد المراجعة'}
                              {' • '}
                              {formatArabicDate(item.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/course/${item.assignment.video.courseId}`}
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors ${
                            isGraded
                              ? 'bg-emerald-600 text-on-primary hover:bg-emerald-700'
                              : 'bg-amber-500 text-on-primary hover:bg-amber-600'
                          }`}
                        >
                          {isGraded ? 'عرض النتيجة' : 'عرض التفاصيل'}
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </FadeIn>
          </section>
        </div>
      </div>
    </div>
  );
}