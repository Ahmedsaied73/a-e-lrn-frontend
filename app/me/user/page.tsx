'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Reveal } from '@/components/reveal';
import { EditProfileModal } from '@/components/edit-profile-modal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser, selectAuth, logout } from '@/store/slices/authSlice';
import { logoutUser } from '@/services/authService';
import { getAchievements } from '@/services/achievementsService';
import type { AchievementsData, AchievementExam } from '@/types/quiz';
import { PageTitle } from '@/components/page-title';
import { withTeacher } from '@/lib/site-config';
import { PAGE_TITLES } from '@/lib/page-titles';

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[words.length - 1][0];
}

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 60) return "text-brand-secondary";
  return "text-brand-accent";
}

interface RecentExam extends AchievementExam {
  courseTitle: string;
  courseSlug: string;
}

export default function UserProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const { initialized, isAuthenticated } = useAppSelector(selectAuth);

  const [data, setData] = useState<AchievementsData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.replace('/login');
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    if (!initialized || !isAuthenticated) {
      setIsDataLoading(false);
      return;
    }
    getAchievements()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setIsDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialized, isAuthenticated]);

  async function handleLogout() {
    await logoutUser();
    dispatch(logout());
    router.push('/login');
  }

  if (!initialized) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
        <div className="h-28 rounded-2xl bg-brand-chip" />
        <div className="mt-8 h-64 rounded-2xl bg-brand-chip" />
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const recentExams: RecentExam[] = courses
    .flatMap((entry) =>
      entry.exams.map((exam) => ({ ...exam, courseTitle: entry.course.title, courseSlug: entry.course.slug })),
    )
    .slice(0, 3);
  const gradedCount = courses.flatMap((entry) => entry.exams).filter((e) => e.bestScore != null).length;
  const avgDisplay = data?.totals.averageScore != null ? `${Math.round(data.totals.averageScore)}٪` : '—';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageTitle title={withTeacher(PAGE_TITLES.profile)} />
      <Reveal>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-6 text-center sm:flex-row sm:text-start">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-secondary text-xl font-bold text-white">
            {user?.name ? getInitials(user.name) : ''}
          </span>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-brand-text">{user?.name || 'المستخدم'}</h1>
            <p className="text-sm text-brand-muted" dir="ltr">{user?.email || ''}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-lg border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-hover"
          >
            تعديل الملف الشخصي
          </button>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Reveal>
            <section className="rounded-2xl border border-brand-border bg-brand-surface p-6">
              <h2 className="text-base font-bold text-brand-text">دوراتي الحالية</h2>
              {isDataLoading ? (
                <div className="mt-5 animate-pulse space-y-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 rounded-lg bg-brand-chip" />
                  ))}
                </div>
              ) : courses.length > 0 ? (
                <div className="mt-5 space-y-5">
                  {courses.map((entry) => {
                    const pct = Math.round(entry.progress.percent);
                    return (
                      <div key={entry.course.slug}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <Link href={`/course/${entry.course.slug}`} className="font-medium text-brand-muted-strong hover:text-brand-primary">
                            {entry.course.title}
                          </Link>
                          <span className="text-brand-muted">{pct}٪</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-chip">
                          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-5 text-sm text-brand-muted">لم تشترك في أي دورة بعد.</p>
              )}
              <Link href="/grades/1" className="mt-5 inline-block text-sm font-semibold text-brand-primary hover:underline">
                تصفح المزيد من الدورات
              </Link>
            </section>
          </Reveal>

          <Reveal delayMs={80}>
            <section className="rounded-2xl border border-brand-border bg-brand-surface p-6">
              <h2 className="text-base font-bold text-brand-text">نتائج الاختبارات الأخيرة</h2>
              {isDataLoading ? (
                <div className="mt-4 animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-brand-chip" />
                  ))}
                </div>
              ) : recentExams.length > 0 ? (
                <div className="mt-4 divide-y divide-brand-border">
                  {recentExams.map((exam) => (
                    <div key={`${exam.courseSlug}-${exam.quizSlug}`} className="flex items-center justify-between py-3">
                      <div>
                        <Link
                          href={`/course/${exam.courseSlug}/video/${exam.videoSlug}/quiz`}
                          className="text-sm font-semibold text-brand-muted-strong hover:text-brand-primary"
                        >
                          {exam.quizTitle}
                        </Link>
                        <p className="text-xs text-brand-muted">{exam.courseTitle}</p>
                      </div>
                      {exam.bestScore != null ? (
                        <span className={"text-sm font-extrabold " + scoreColor(exam.bestScore)}>{Math.round(exam.bestScore)}٪</span>
                      ) : (
                        <span className="text-sm font-bold text-brand-muted">—</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-brand-muted">لا توجد نتائج اختبارات بعد.</p>
              )}
            </section>
          </Reveal>
        </div>

        <Reveal delayMs={120}>
          <aside className="space-y-6">
            <section className="rounded-2xl border border-brand-border bg-brand-surface p-6 text-center">
              <p className="text-xs font-semibold text-brand-muted">متوسط الأداء العام</p>
              <p className="mt-2 text-4xl font-extrabold text-brand-primary">{avgDisplay}</p>
              <p className="mt-1 text-xs text-brand-muted">بناءً على {gradedCount} اختبارات</p>
            </section>

            <section className="rounded-2xl border border-brand-border bg-brand-surface p-6">
              <h2 className="text-sm font-bold text-brand-text">الإعدادات</h2>
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-brand-muted-strong transition hover:bg-brand-hover"
                >
                  بيانات الحساب
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand-muted"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-brand-muted-strong transition hover:bg-brand-hover"
                >
                  كلمة المرور والأمان
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand-muted"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 w-full rounded-lg px-3 py-2.5 text-start text-sm font-semibold text-brand-accent transition hover:bg-red-50"
                >
                  تسجيل الخروج
                </button>
              </div>
            </section>
          </aside>
        </Reveal>
      </div>

      {editOpen && user && (
        <EditProfileModal user={user} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
}
