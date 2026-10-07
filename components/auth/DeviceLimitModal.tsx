'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, MessageCircle, X } from 'lucide-react';

interface DeviceLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceLimitModal({ isOpen, onClose }: DeviceLimitModalProps) {
  // Support WhatsApp number or contact channel
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '201000000000';
  const supportUrl = `https://wa.me/${supportPhone}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-right font-sans" dir="rtl">
        <DialogHeader className="text-right sm:text-right">
          <div className="mx-auto sm:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            تم بلوغ الحد الأقصى للأجهزة (٣ أجهزة)
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed mt-2">
            حسابك مسجل حالياً على ٣ أجهزة مختلفة (الحد الأقصى المسموح به). لمنع مشاركة الحسابات وحماية أمان دراستك، لا يمكن الدخول من هذا الجهاز.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-200 leading-normal">
          💡 إذا قمت بتغيير هاتفك أو حاسوبك، يرجى التواصل مع الدعم الفني لمساعدتك في إلغاء ربط الجهاز القديم وإتاحة هذا الجهاز.
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            asChild
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2"
          >
            <a href={supportUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              تواصل مع الدعم الفني
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
