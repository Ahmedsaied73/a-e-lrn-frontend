'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Reveal } from '@/components/reveal';
import { getEnrolledCourses } from '@/services/courseService';
import type { CourseListItem } from '@/services/courseService';

export default function UserSubscriptionsPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const data = await getEnrolledCourses();
        setCourses(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        console.error('خطأ في جلب الاشتراكات:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الاشتراكات');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-12 sm:px-6">
        <div className="h-9 w-48 rounded-lg bg-brand-chip" />
        <div className="mt-2 h-4 w-72 rounded bg-brand-chip" />
        <div className="mt-8 h-28 rounded-2xl bg-brand-chip" />
        <div className="mt-10 h-40 rounded-2xl bg-brand-chip" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <p className="text-base font-bold text-brand-text">تعذر تحميل الاشتراكات</p>
        <p className="mt-2 text-sm text-brand-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Reveal>
        <h1 className="text-2xl font-extrabold text-brand-text sm:text-3xl">اشتراكاتك</h1>
        <p className="mt-2 text-sm text-brand-muted">الدورات التي انضممت إليها، وحالتها الحالية.</p>
      </Reveal>

      <Reveal delayMs={80} className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-border bg-brand-surface px-6 py-5">
        <div>
          <p className="text-xs font-semibold text-brand-secondary">خطتك الحالية</p>
          <p className="mt-1 text-lg font-extrabold text-brand-text">الوصول الكامل للدورات</p>
          <p className="mt-1 text-xs text-brand-muted">
            {courses.length > 0 ? `لديك ${courses.length} دورات نشطة` : "لم تشترك في أي دورة بعد"}
          </p>
        </div>
        <Link
          href="/grades/1"
          className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-primary/90"
        >
          إدارة الاشتراك
        </Link>
      </Reveal>

      <Reveal delayMs={130} className="mt-10">
        <p className="text-sm font-bold text-brand-text">الدورات المشترك بها</p>
        {courses.length > 0 ? (
          <div className="mt-3 divide-y divide-brand-border rounded-2xl border border-brand-border bg-brand-surface">
            {courses.map((course) => (
              <div key={course.slug} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-brand-text">{course.title}</p>
                  <p className="mt-0.5 text-xs text-brand-muted">
                    {course.price && course.price > 0 ? "مدفوع" : "مجاني"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">نشط</span>
                  <Link href={`/course/${course.slug}`} className="text-sm font-semibold text-brand-primary hover:underline">
                    عرض الدورة
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-brand-border bg-brand-surface px-5 py-10 text-center">
            <p className="text-sm font-semibold text-brand-text">لا يوجد اشتراكات حالياً</p>
            <p className="mt-1 text-xs text-brand-muted">يمكنك الاشتراك في الكورسات من صفحة الدورات</p>
          </div>
        )}
      </Reveal>
    </div>
  );
}
