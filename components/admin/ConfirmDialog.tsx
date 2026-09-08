'use client';

import { AlertTriangle } from 'lucide-react';

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
}

export function ConfirmDialog({ open, title, description, confirmLabel, busy = false, onOpenChange, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-outline-variant/70 bg-card text-on-surface">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-on-surface">
            <AlertTriangle className="h-4 w-4 text-error" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-outline-variant text-on-surface-variant hover:border-[#207bff] hover:text-[#0057c0]" onClick={() => onOpenChange(false)} disabled={busy}>
            إلغاء
          </Button>
          <Button className="bg-error text-white hover:bg-[#93000a]" onClick={onConfirm} disabled={busy}>
            {busy ? 'جارٍ الحذف...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}