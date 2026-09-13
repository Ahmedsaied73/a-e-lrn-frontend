'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { enrollInCourse } from '@/services/courseService';
import { toast } from 'react-hot-toast';

interface EnrollmentCardProps {
  courseId: string;
  isEnrolled: boolean;
  coursePrice: string | number;
  courseDuration: string | number;
  examsCount: string | number;
  lessonsCount: number;
  completedCount?: number;
  primaryVideoHref?: string;
  className?: string;
  onEnrollSuccess?: () => void;
}

const PERKS = [
  'وصول فوري لكل الفيديوهات والملفات',
  'متابعة دورية وتصحيح تفصيلي للأسئلة المقالية',
  'شهادة معتمدة عند اجتياز الاختبارات',
];

export function EnrollmentCard({
  courseId,
  isEnrolled,
  coursePrice,
  courseDuration,
  examsCount,
  lessonsCount,
  completedCount = 0,
  primaryVideoHref,
  className,
  onEnrollSuccess,
}: EnrollmentCardProps) {
  const [loading, setLoading] = useState(false);

  const handleEnrollment = async () => {
    if (isEnrolled) return toast.success('أنت مشترك بالفعل في هذا الكورس');

    setLoading(true);
    try {
      await enrollInCourse(courseId);
      toast.success('تم الاشتراك في الكورس بنجاح!');
      if (onEnrollSuccess) {
        onEnrollSuccess();
      } else {
        window.location.reload();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الاشتراك في الكورس');
    } finally {
      setLoading(false);
    }
  };

  const priceDisplay =
    typeof coursePrice === 'number' && coursePrice > 0
      ? `${coursePrice} ج.م`
      : typeof coursePrice === 'string' && coursePrice.trim() !== ''
        ? coursePrice
        : 'مجاني';
  const isFree = priceDisplay === 'مجاني';
  const progress = lessonsCount > 0 ? Math.round((completedCount / lessonsCount) * 100) : 0;

  return (
    <div className={cn('sticky top-24 space-y-5', className)}>
      <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-sm">
        <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary">
          {primaryVideoHref ? (
            <Link
              href={primaryVideoHref}
              aria-label="تشغيل الفيديو التعريفي"
              className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-brand-primary shadow transition hover:scale-105"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
            </Link>
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-brand-primary shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-brand-muted">
              <span>تقدمك في الدورة</span>
              <span>{progress}٪</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-chip">
              <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="rounded-lg bg-brand-bg py-3">
              <p className="font-bold text-brand-text">{lessonsCount}</p>
              <p className="mt-0.5 text-brand-muted">محاضرات</p>
            </div>
            <div className="rounded-lg bg-brand-bg py-3">
              <p className={'font-bold ' + (isFree ? 'text-emerald-600' : 'text-brand-text')}>{priceDisplay}</p>
              <p className="mt-0.5 text-brand-muted">سعر الدورة</p>
            </div>
            <div className="rounded-lg bg-brand-bg py-3">
              <p className="font-bold text-brand-text">{examsCount}</p>
              <p className="mt-0.5 text-brand-muted">اختبارات</p>
            </div>
            <div className="rounded-lg bg-brand-bg py-3">
              <p className="font-bold text-brand-text">{courseDuration}</p>
              <p className="mt-0.5 text-brand-muted">المدة الإجمالية</p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-brand-muted-strong">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-emerald-500"><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {p}
              </li>
            ))}
          </ul>

          {isEnrolled ? (
            primaryVideoHref ? (
              <Link
                href={primaryVideoHref}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
              >
                متابعة التعلم
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
              </Link>
            ) : (
              <span className="mt-5 flex w-full cursor-default items-center justify-center gap-2 rounded-lg bg-brand-chip py-3 text-sm font-semibold text-brand-muted">
                أنت مشترك في هذه الدورة
              </span>
            )
          ) : (
            <button
              onClick={handleEnrollment}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  جاري الاشتراك...
                </span>
              ) : (
                'الاشتراك في الدورة الآن'
              )}
            </button>
          )}
          <p className="mt-3 text-center text-xs text-brand-muted">
            ضمان استرجاع ١٠٠٪ خلال ٧ أيام من بدء الدراسة
          </p>
        </div>
      </div>
    </div>
  );
}
