'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Reveal } from '@/components/reveal';
import { getAchievements } from '@/services/achievementsService';
import type { AchievementsData } from '@/types/quiz';

function gradeColor(pct: number) {
  if (pct >= 85) return "text-brand-primary";
  if (pct >= 60) return "text-brand-secondary";
  return "text-brand-accent";
}

export default function UserAchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const result = await getAchievements();
        setData(result);
      } catch (err: unknown) {
        console.error('خطأ في جلب الانجازات:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الانجازات');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-12 sm:px-6">
        <div className="h-9 w-64 rounded-lg bg-brand-chip" />
        <div className="mt-5 h-14 rounded-lg bg-brand-chip" />
        <div className="mt-8 h-40 rounded-2xl bg-brand-chip" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <p className="text-base font-bold text-brand-text">تعذر تحميل الإنجازات</p>
        <p className="mt-2 text-sm text-brand-muted">{error}</p>
      </div>
    );
  }

  if (!data || data.courses.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-2xl font-extrabold text-brand-text sm:text-3xl">إنجازاتك التعليمية</h1>
        <p className="mt-4 text-sm text-brand-muted">لا توجد انجازات بعد — اشترك في الكورسات وشاهد الدروس وحل الاختبارات لبدء تجميع انجازاتك</p>
        <Link href="/grades/1" className="mt-6 inline-block text-sm font-semibold text-brand-primary hover:underline">
          تصفح المزيد من الدورات
        </Link>
      </div>
    );
  }

  const totals = data.totals;
  const avgDisplay = totals.averageScore != null ? `${Math.round(totals.averageScore)}٪` : "—";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Reveal>
        <h1 className="text-2xl font-extrabold text-brand-text sm:text-3xl">إنجازاتك التعليمية</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-brand-border py-4 text-sm text-brand-muted-strong">
          <span>{totals.coursesEnrolled} دورات مشترك بها</span>
          <span className="text-brand-muted">|</span>
          <span>متوسط درجات الاختبارات {avgDisplay}</span>
          <span className="text-brand-muted">|</span>
          <span>{totals.videosWatched} من {totals.videosTotal} محاضرة تمت مشاهدتها</span>
        </div>
      </Reveal>

      <Reveal delayMs={130} className="mt-10">
        <p className="text-sm font-bold text-brand-text">تقدمك في الدورات</p>
        <div className="mt-3 space-y-5 rounded-2xl border border-brand-border bg-brand-surface p-6">
          {data.courses.map((entry) => {
            const pct = Math.round(entry.progress.percent);
            return (
              <div key={entry.course.slug}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <Link href={`/course/${entry.course.slug}`} className="font-medium text-brand-muted-strong hover:text-brand-primary">
                    {entry.course.title}
                  </Link>
                  <span className="text-brand-muted">{entry.progress.watched} من {entry.progress.total} محاضرة</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-chip">
                  <div
                    className={"h-full rounded-full " + (entry.progress.completed ? "bg-brand-primary" : "bg-brand-secondary")}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal delayMs={180} className="mt-10">
        <p className="text-sm font-bold text-brand-text">درجات الاختبارات</p>
        <div className="mt-3 divide-y divide-brand-border rounded-2xl border border-brand-border bg-brand-surface">
          {data.courses.flatMap((entry) =>
            entry.exams.map((exam) => (
              <div key={`${entry.course.slug}-${exam.quizSlug}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <Link
                    href={`/course/${entry.course.slug}/video/${exam.videoSlug}/quiz`}
                    className="text-sm font-semibold text-brand-text hover:text-brand-primary"
                  >
                    {exam.quizTitle}
                  </Link>
                  <p className="mt-0.5 text-xs text-brand-muted">{entry.course.title}</p>
                </div>
                <div className="text-end">
                  {exam.bestScore != null ? (
                    <>
                      <p className={"text-sm font-extrabold " + gradeColor(exam.bestScore)}>{Math.round(exam.bestScore)}٪</p>
                      <p className="text-xs text-brand-muted">{exam.passed ? "ناجح" : "لم يُجتز بعد"}</p>
                    </>
                  ) : exam.attemptsUsed > 0 ? (
                    <>
                      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">بانتظار التصحيح</span>
                      <p className="mt-0.5 text-xs text-brand-muted">تم التسليم — النتيجة قريباً</p>
                    </>
                  ) : (
                    <p className="text-xs font-semibold text-brand-muted">لم يُحل بعد</p>
                  )}
                </div>
              </div>
            )),
          )}
        </div>
      </Reveal>

      <Reveal delayMs={220} className="mt-10 text-center">
        <Link href="/grades/1" className="text-sm font-semibold text-brand-primary hover:underline">
          تصفح المزيد من الدورات
        </Link>
      </Reveal>
    </div>
  );
}
