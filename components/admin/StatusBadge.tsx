import { cn } from '@/lib/utils';
import type { AttemptStatus, VideoStatus } from '@/types/admin';

type Status = VideoStatus | AttemptStatus | 'PENDING' | 'GRADED' | 'PLACED' | 'PAID' | 'UNPAID';

const variantByStatus: Record<Status, string> = {
  PENDING: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  UPLOADING: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  PROCESSING: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  READY: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  FAILED: 'border-red-500/40 bg-red-500/10 text-red-300',
  IN_PROGRESS: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  SUBMITTED: 'border-slate-400/40 bg-slate-400/10 text-slate-300',
  GRADING: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  GRADED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  EXPIRED: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
  PLACED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  PAID: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  UNPAID: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
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
        variantByStatus[status] ?? 'border-slate-600 bg-slate-700/40 text-slate-300',
        className,
      )}
    >
      {labelByStatus[status] ?? status}
    </span>
  );
}