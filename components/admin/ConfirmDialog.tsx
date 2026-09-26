'use client';

import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /**
   * Presentation only (added by the admin restyle) — see DataTable's `variant`.
   * 'default' keeps the pre-migration chrome for the pages not migrated yet.
   */
  variant?: 'default' | 'brand';
}

export function ConfirmDialog({ open, title, description, confirmLabel, busy = false, onOpenChange, onConfirm, variant = 'default' }: ConfirmDialogProps) {
  const brand = variant === 'brand';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:rounded-2xl', brand ? 'border-brand-border bg-brand-surface text-brand-text' : 'border-outline-variant/70 bg-card text-on-surface')}>
        <DialogHeader>
          <DialogTitle className={cn('flex items-center gap-2', brand ? 'text-brand-text' : 'text-on-surface')}>
            <AlertTriangle className={cn('h-4 w-4', brand ? 'text-brand-accent' : 'text-error')} />
            {title}
          </DialogTitle>
          <DialogDescription className={brand ? 'text-brand-muted-strong' : 'text-on-surface-variant'}>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2.5">
          <Button
            variant="outline"
            className={brand
              ? 'rounded-full border-brand-border px-4 py-2.5 text-sm font-semibold text-brand-muted-strong hover:bg-brand-hover hover:text-brand-text'
              : 'border-outline-variant text-on-surface-variant hover:border-primary-color hover:text-[#0057c0]'}
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            إلغاء
          </Button>
          <Button
            className={brand
              ? 'rounded-full bg-brand-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent/90'
              : 'bg-error text-white hover:bg-on-error-container'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'جارٍ الحذف...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}