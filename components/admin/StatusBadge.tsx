import { cn } from '@/lib/utils';
import type { AttemptStatus, VideoStatus } from '@/types/admin';

type Status = VideoStatus | AttemptStatus | 'PENDING' | 'GRADED' | 'PLACED' | 'PAID' | 'UNPAID';

const variantByStatus: Record<Status, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  UPLOADING: 'border-sky-200 bg-sky-50 text-sky-700',
  PROCESSING: 'border-sky-200 bg-sky-50 text-sky-700',
  READY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-red-200 bg-red-50 text-red-700',
  IN_PROGRESS: 'border-sky-200 bg-sky-50 text-sky-700',
  SUBMITTED: 'border-slate-200 bg-slate-100 text-slate-600',
  GRADING: 'border-amber-200 bg-amber-50 text-amber-700',
  GRADED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  EXPIRED: 'border-slate-200 bg-slate-50 text-slate-500',
  PLACED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UNPAID: 'border-amber-200 bg-amber-50 text-amber-700',
};

const labelByStatus: Record<Status, string> = {
  PENDING: 'قيد الانتظار',
  UPLOADING: 'جارٍ الرفع',
  PROCESSING: 'جارٍ المعالجة',
  READY: 'جاهز',
  FAILED: 'فشل',
  IN_PROGRESS: 'جارٍ الحل',
  SUBMITTED: 'تم التسليم',
  GRADING: 'بانتظار التصحيح',
  GRADED: 'تم التصحيح',
  EXPIRED: 'منتهي',
  PLACED: 'مكتمل',
  PAID: 'مدفوع',
  UNPAID: 'غير مدفوع',
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        variantByStatus[status] ?? 'border-slate-200 bg-slate-100 text-slate-600',
        className,
      )}
    >
      {labelByStatus[status] ?? status}
    </span>
  );
}