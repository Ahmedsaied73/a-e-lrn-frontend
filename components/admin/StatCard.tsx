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

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-slate-300',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
};

export function StatCard({ label, value, icon: Icon, hint, tone = 'default', loading }: StatCardProps) {
  return (
    <div className="group rounded-xl border border-slate-700/60 bg-card p-4 shadow-sm transition-colors duration-200 hover:border-slate-500">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16 bg-muted" />
          ) : (
            <p className={cn('mt-1 font-mono text-2xl font-semibold tabular-nums', toneClasses[tone])}>{value}</p>
          )}
          {hint && !loading && <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>}
        </div>
        <div className={cn('rounded-lg border border-slate-700/60 bg-muted p-2 text-slate-300', toneClasses[tone])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}