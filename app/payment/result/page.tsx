'use client';

/**
 * Payment result page — /payment/result (the backend's Paymob redirection_url).
 *
 * Two entry modes:
 *  1. ?ref=<providerReference> present → poll that payment's status directly.
 *  2. No ref (Paymob redirects to the bare URL) → recover by reading the
 *     student's payment history and polling the most recent open payment.
 *
 * Polls every 3s until a terminal status; never auto-navigates away.
 */
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { clearUserEntries } from '@/lib/data-cache';
import {
  getPaymentHistory,
  getPaymentStatus,
  type PaymentStatusState,
} from '@/services/paymentService';
import { PageTitle } from '@/components/page-title';
import { withTeacher } from '@/lib/site-config';
import { PAGE_TITLES } from '@/lib/page-titles';

const POLL_MS = 3000;

type Phase = 'loading' | 'pending' | 'success' | 'failed' | 'expired' | 'refunded' | 'error';

function statusToPhase(status: PaymentStatusState): Phase {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'FAILED': return 'failed';
    case 'EXPIRED': return 'expired';
    case 'REFUNDED': return 'refunded';
    default: return 'pending';
  }
}

function ResultInner() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState('');
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  // Polling state lives in refs so interval callbacks always see fresh values.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const applyStatus = useCallback((status: PaymentStatusState, course?: { slug: string; title: string } | null) => {
    if (course) {
      setCourseSlug(course.slug);
      setCourseTitle(course.title);
    }
    const next = statusToPhase(status);
    setPhase(next);
    if (next !== 'pending') stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    const pollDirect = async (ref: string) => {
      try {
        const status = await getPaymentStatus(ref);
        applyStatus(status.status, status.course);
      } catch {
        // 404 = not found / not ours. Stop quietly; show a neutral error.
        stopPolling();
        setPhase('error');
        setMessage('لم نتمكن من العثور على بيانات هذه العملية.');
      }
    };

    /** No ?ref → recover the most recent open payment from history. */
    const recoverFromHistory = async () => {
      setRecovering(true);
      try {
        const history = await getPaymentHistory();
        const candidate = history.find((p) => p.status === 'PENDING')
          || history.find((p) => p.status === 'COMPLETED');
        if (!candidate) {
          setPhase('error');
          setMessage('لم نجد أي عملية دفع حديثة. إن كنت قد دفعت للتو، أعد المحاولة بعد لحظات.');
          return;
        }
        applyStatus(candidate.status, candidate.course);
        if (candidate.status === 'PENDING') {
          timerRef.current = setInterval(() => pollDirect(candidate.providerReference), POLL_MS);
        }
      } catch {
        setPhase('error');
        setMessage('تعذر جلب حالة الدفع. حاول تحديث الصفحة.');
      } finally {
        setRecovering(false);
      }
    };

    if (refParam) {
      pollDirect(refParam);
      timerRef.current = setInterval(() => pollDirect(refParam), POLL_MS);
    } else {
      recoverFromHistory();
    }

    return () => stopPolling();
  }, [refParam, applyStatus, stopPolling]);

  // A successful payment flips per-user state (enrollment isPaid, course page
  // payload). Drop the user-scoped cache so navigating to the course renders
  // the unlocked page immediately instead of a stale locked one (matches the
  // apiClient invalidation convention for state-flipping mutations).
  useEffect(() => {
    if (phase === 'success') {
      clearUserEntries();
    }
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const shell = 'mx-auto max-w-md rounded-xl border border-brand-border bg-brand-surface p-8 text-center shadow-sm';

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className={shell}>
        {phase === 'loading' && (
          <>
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
            <p className="mt-4 text-sm text-brand-muted">جاري التحقق من حالة الدفع...</p>
          </>
        )}

        {phase === 'pending' && (
          <>
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
            <h1 className="mt-4 text-lg font-bold text-brand-text">في انتظار تأكيد الدفع</h1>
            <p className="mt-2 text-sm text-brand-muted">
              {recovering ? 'جاري البحث عن أحدث عملية دفع...' : 'يتم تحديث الصفحة تلقائيًا كل بضع ثوانٍ.'}
            </p>
          </>
        )}

        {phase === 'success' && (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <h1 className="mt-4 text-lg font-bold text-brand-text">تم تأكيد الدفع بنجاح!</h1>
            {courseTitle && <p className="mt-1 text-sm text-brand-muted">{courseTitle}</p>}
            <p className="mt-1 text-xs text-brand-muted">صلاحية الوصول سنة كاملة من تاريخ الشراء.</p>
            <Link
              href={courseSlug ? `/course/${courseSlug}` : '/'}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
            >
              ابدأ التعلم الآن
            </Link>
          </>
        )}

        {phase === 'failed' && (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
            </span>
            <h1 className="mt-4 text-lg font-bold text-brand-text">فشلت عملية الدفع</h1>
            <p className="mt-2 text-sm text-brand-muted">لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى.</p>
            <Link
              href={courseSlug ? `/course/${courseSlug}` : '/'}
              className="mt-5 flex w-full items-center justify-center rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
            >
              إعادة المحاولة
            </Link>
          </>
        )}

        {phase === 'expired' && (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
            <h1 className="mt-4 text-lg font-bold text-brand-text">انتهت صلاحية جلسة الدفع</h1>
            <p className="mt-2 text-sm text-brand-muted">لم تُكتمل العملية خلال المدة المحددة. يمكنك البدء من جديد.</p>
            <Link
              href={courseSlug ? `/course/${courseSlug}` : '/'}
              className="mt-5 flex w-full items-center justify-center rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
            >
              المحاولة من جديد
            </Link>
          </>
        )}

        {phase === 'refunded' && (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-chip text-brand-muted">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 2.3 5.7M4 12V7m0 5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <h1 className="mt-4 text-lg font-bold text-brand-text">تم إعادة المبلغ</h1>
            <p className="mt-2 text-sm text-brand-muted">إذا كان هذا بالخطأ، تواصل مع الدعم.</p>
            <Link href="/" className="mt-5 text-sm font-semibold text-brand-primary hover:underline">
              العودة للرئيسية
            </Link>
          </>
        )}

        {phase === 'error' && (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
            <h1 className="mt-4 text-lg font-bold text-brand-text">تعذر التحقق من الدفع</h1>
            <p className="mt-2 text-sm text-brand-muted">{message || 'حدث خطأ غير متوقع.'}</p>
            <Link href="/" className="mt-5 text-sm font-semibold text-brand-primary hover:underline">
              العودة للرئيسية
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <>
      <PageTitle title={withTeacher(PAGE_TITLES.paymentResult)} />
      <Suspense fallback={
        <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
        </main>
      }>
        <ResultInner />
      </Suspense>
    </>
  );
}




