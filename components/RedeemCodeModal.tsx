'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { accessCodeService, convertArabicDigits } from '@/services/accessCodeService';
import { ApiError, ConflictError, RateLimitError } from '@/lib/errors';
import type { RedeemCodeResponse } from '@/types/accessCode';

interface RedeemCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseSlug?: string;
  courseTitle?: string;
  onSuccess?: (res: RedeemCodeResponse) => void;
}

function formatCodeInput(value: string): string {
  const converted = convertArabicDigits(value);
  const clean = converted.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  const chunks = clean.match(/.{1,4}/g);
  return chunks ? chunks.join('-') : clean;
}

export function RedeemCodeModal({
  open,
  onOpenChange,
  courseSlug,
  courseTitle,
  onSuccess,
}: RedeemCodeModalProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RedeemCodeResponse | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCodeInput(e.target.value);
    setCode(formatted);
    if (errorMsg) setErrorMsg(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog animation completes
    setTimeout(() => {
      setCode('');
      setErrorMsg(null);
      setSuccessData(null);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = code.replace(/[\s-]/g, '').trim();
    if (!raw) {
      setErrorMsg('يرجى كتابة كود التفعيل.');
      return;
    }
    if (raw.length < 6) {
      setErrorMsg('كود التفعيل غير مكتمل، يرجى كتابة الكود كاملاً.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await accessCodeService.redeemCode(raw);
      setSuccessData(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: unknown) {
      if (err instanceof ConflictError) {
        setErrorMsg('أنت مشترك بالفعل في هذا الكورس. لم يتم استهلاك الكود.');
      } else if (err instanceof RateLimitError) {
        setErrorMsg('لقد تجاوزت الحد الأقصى لمحاولات التفعيل. يرجى الانتظار 15 دقيقة.');
      } else if (err instanceof ApiError) {
        const bodyCode = (err.body as { code?: string } | null)?.code;
        if (err.status === 422 || bodyCode === 'INVALID_CODE') {
          setErrorMsg('هذا الكود غير صالح أو تم استخدامه بالفعل.');
        } else if (err.status === 409 || bodyCode === 'ALREADY_ENROLLED') {
          setErrorMsg('أنت مشترك بالفعل في هذا الكورس. لم يتم استهلاك الكود.');
        } else if (err.status === 429 || bodyCode === 'RATE_LIMITED') {
          setErrorMsg('لقد تجاوزت الحد الأقصى للمحاولات. يرجى الانتظار 15 دقيقة.');
        } else {
          setErrorMsg(err.message || 'حدث خطأ أثناء تفعيل الكود.');
        }
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء تفعيل الكود.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : onOpenChange(true))}>
      <DialogContent className="max-w-md rounded-3xl border-brand-border bg-brand-surface text-brand-text p-6">
        <DialogHeader className="text-center sm:text-start">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <Ticket className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-brand-text">
                تفعيل الاشتراك بكود السنتر
              </DialogTitle>
              {courseTitle && (
                <p className="mt-0.5 text-xs text-brand-muted truncate max-w-xs">
                  {courseTitle}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        {!successData ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="modalCodeInput" className="block text-xs font-semibold text-brand-muted-strong mb-2">
                كود التفعيل المطبوع على الكارت:
              </label>
              <div className="relative">
                <input
                  id="modalCodeInput"
                  type="text"
                  dir="ltr"
                  value={code}
                  onChange={handleInputChange}
                  placeholder="XXXX-XXXX"
                  autoComplete="off"
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-brand-border bg-brand-bg px-4 py-3 text-center font-mono text-xl sm:text-2xl font-black tracking-widest text-brand-text placeholder:text-brand-muted/40 uppercase outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
                {code && !loading && (
                  <button
                    type="button"
                    onClick={() => setCode('')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-center text-[11px] text-brand-muted">
                الحروف والأرقام بالإنجليزية (مثال: A7X3-K9M2)
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="rounded-full border-brand-border text-xs"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="rounded-full bg-brand-primary px-6 text-xs font-bold text-white hover:bg-brand-primary/90"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white me-1.5" />
                    جارٍ التحقق...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 me-1.5" />
                    تفعيل الاشتراك
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h3 className="mt-3 text-lg font-bold text-brand-text">
              تم تفعيل الكورس بنجاح!
            </h3>
            <p className="mt-1 text-xs text-brand-muted">
              أصبحت الآن مشتركاً في: <strong>{successData.courseName}</strong>
            </p>
            <Button
              type="button"
              onClick={() => {
                handleClose();
                const targetSlug = successData.courseSlug || courseSlug;
                if (targetSlug) {
                  router.push(`/course/${targetSlug}`);
                }
              }}
              className="mt-5 w-full rounded-full bg-brand-primary text-xs font-bold text-white hover:bg-brand-primary/90"
            >
              بدء المشاهدة الآن
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
