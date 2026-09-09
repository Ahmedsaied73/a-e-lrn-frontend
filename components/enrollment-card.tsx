'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  CircleDollarSign,
  ListVideo,
  Timer,
  FileQuestion,
  ShoppingBag,
  Play,
  ShieldCheck,
  FlaskConical,
  Check,
  BadgeCheck,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { enrollInCourse } from '@/services/courseService';

interface EnrollmentCardProps {
  courseId: string;
  isEnrolled: boolean;
  courseTitle: string;
  coursePrice: string | number;
  courseDuration: string | number;
  examsCount: string | number;
  lessonsCount: string | number;
  thumbnail?: string | null;
  gradeLabel?: string;
  primaryVideoHref?: string;
  className?: string;
  onEnrollSuccess?: () => void;
}

export function EnrollmentCard({
  courseId,
  isEnrolled,
  courseTitle,
  coursePrice,
  courseDuration,
  examsCount,
  lessonsCount,
  thumbnail,
  gradeLabel,
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
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء الاشتراك في الكورس');
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

  return (
    <aside
      className={cn(
        'flex flex-col gap-5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm',
        className,
      )}
    >
      {/* Course Image with Badge */}
      <div className="group relative aspect-video overflow-hidden rounded-xl shadow-sm">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={courseTitle}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        ) : (
          <div className="primary-gradient flex h-full w-full items-center justify-center">
            <FlaskConical className="h-12 w-12 text-white/90" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        {gradeLabel && (
          <span className="absolute top-3 right-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-on-primary shadow-md">
            {gradeLabel}
          </span>
        )}
        <span className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest/90 text-primary shadow-lg">
          <Play size={28} className="pr-0.5" fill="currentColor" aria-hidden="true" />
        </span>
      </div>

      {/* Title + Verified */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[18px] font-bold leading-tight text-on-surface">
          {courseTitle}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BadgeCheck size={16} aria-hidden="true" />
          </div>
          <span className="text-[13px] font-semibold text-on-surface">محتوى معتمد</span>
          <BadgeCheck className="text-primary" size={16} aria-hidden="true" />
        </div>
      </div>

      {/* Meta Information Grid */}
      <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/40 pt-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-surface-container-low p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CircleDollarSign size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-on-surface-variant">سعر الدورة</div>
            <div className="text-[15px] font-bold text-primary">{priceDisplay}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-surface-container-low p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary-color/10 text-secondary-color">
            <ListVideo size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-on-surface-variant">عدد الحصص</div>
            <div className="text-[14px] font-bold text-on-surface">{lessonsCount} محاضرة</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-surface-container-low p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-tertiary/10 text-tertiary">
            <Timer size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-on-surface-variant">المدة الإجمالية</div>
            <div className="text-[14px] font-bold text-on-surface">{courseDuration}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-surface-container-low p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileQuestion size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-on-surface-variant">الاختبارات</div>
            <div className="text-[14px] font-bold text-on-surface">{examsCount} اختبار</div>
          </div>
        </div>
      </div>

      {/* Course Features */}
      <div className="flex flex-col gap-2 py-1 text-[13px] text-on-surface-variant">
        <div className="flex items-center gap-2">
          <Check className="text-emerald-600" size={18} aria-hidden="true" />
          <span>وصول فوري لكافة الفيديوهات والملفات</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="text-emerald-600" size={18} aria-hidden="true" />
          <span>متابعة دورية وتصحيح تفصيلي للأسئلة المقالية</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="text-emerald-600" size={18} aria-hidden="true" />
          <span>شهادة إتمام معتمدة بعد اجتياز الاختبارات</span>
        </div>
      </div>

      {/* CTA Actions */}
      <div className="flex flex-col gap-2.5 border-t border-outline-variant/40 pt-2">
        {isEnrolled ? (
          primaryVideoHref ? (
            <Link
              href={primaryVideoHref}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[15px] font-bold text-on-primary shadow-md shadow-primary/20 transition-all hover:bg-on-primary-fixed-variant"
            >
              <Play size={20} aria-hidden="true" />
              متابعة التعلم
            </Link>
          ) : (
            <button
              disabled
              className="flex w-full cursor-default items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-3 text-[15px] font-bold text-on-surface-variant"
            >
              <Lock size={18} aria-hidden="true" />
              أنت مشترك في هذه الدورة
            </button>
          )
        ) : (
          <button
            onClick={handleEnrollment}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[15px] font-bold text-on-primary shadow-md shadow-primary/20 transition-all hover:bg-on-primary-fixed-variant disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                جاري الاشتراك...
              </span>
            ) : (
              <>
                <ShoppingBag size={20} aria-hidden="true" />
                الاشتراك في الدورة الآن
              </>
            )}
          </button>
        )}
      </div>

      {/* Guarantee */}
      <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-on-surface-variant">
        <ShieldCheck size={14} className="text-emerald-600" aria-hidden="true" />
        ضمان استرجاع 100% خلال 7 أيام من بدء الدراسة
      </div>
    </aside>
  );
}