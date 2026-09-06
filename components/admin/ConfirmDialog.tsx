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
      <DialogContent className="border-slate-700/60 bg-card text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-slate-100" onClick={() => onOpenChange(false)} disabled={busy}>
            إلغاء
          </Button>
          <Button className="bg-red-500 text-white hover:bg-red-400" onClick={onConfirm} disabled={busy}>
            {busy ? 'جارٍ الحذف...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}