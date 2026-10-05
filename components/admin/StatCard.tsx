import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

const iconChipByTone: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-[#e8f2ff] text-primary-color',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
};

const valueByTone: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-on-surface',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
};

export function StatCard({ label, value, icon: Icon, hint, tone = 'default', loading }: StatCardProps) {
  return (
    <div className="group rounded-xl border border-outline-variant/70 bg-card p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-color/40 hover:shadow-level-2">
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs sm:text-[13px] font-medium text-on-surface-variant">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 sm:mt-2 h-7 sm:h-8 w-14 sm:w-16 bg-muted" />
          ) : (
            <p className={cn('mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold tabular-nums', valueByTone[tone])}>{value}</p>
          )}
          {hint && !loading && <p className="mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs text-on-surface-variant/70">{hint}</p>}
        </div>
        <div className={cn('rounded-lg p-1.5 sm:p-2', iconChipByTone[tone])}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}