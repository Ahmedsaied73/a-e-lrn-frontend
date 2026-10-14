'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { PageTitle } from '@/components/page-title';
import { useAppSelector } from '@/store/hooks';
import { selectAuth, selectUser } from '@/store/slices/authSlice';
import { accessCodeService, convertArabicDigits } from '@/services/accessCodeService';
import { ApiError, ConflictError, RateLimitError } from '@/lib/errors';
import type { RedeemCodeResponse } from '@/types/accessCode';

/**
 * Formats a raw alphanumeric string into dashed groups of 4:
 * e.g. "A7X3K9M2" -> "A7X3-K9M2"
 * Transliterates Arabic numerals and clamps to max 16 characters.
 */
function formatCodeInput(value: string): string {
  const converted = convertArabicDigits(value);
  const clean = converted.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  const chunks = clean.match(/.{1,4}/g);
  return chunks ? chunks.join('-') : clean;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function RedeemCodePage() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const { initialized, isAuthenticated } = useAppSelector(selectAuth);
  const enabled = user?.features?.accessCodes !== false;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RedeemCodeResponse | null>(null);

  // Require authentication
  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.replace('/login?redirect=/me/redeem');
    }
  }, [initialized, isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCodeInput(e.target.value);
    setCode(formatted);
    if (errorMsg) setErrorMsg(null);
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
    } catch (err: unknown) {
      if (err instanceof ConflictError) {
        setErrorMsg('أنت مشترك بالفعل في هذا الكورس. لم يتم استهلاك الكود، ويمكنك استخدامه في حساب آخر.');
      } else if (err instanceof RateLimitError) {
        setErrorMsg('لقد تجاوزت الحد الأقصى لمحاولات التفعيل (5 محاولات). يرجى الانتظار 15 دقيقة ثم المحاولة مجدداً.');
      } else if (err instanceof ApiError) {
        const bodyCode = (err.body as { code?: string } | null)?.code;
        if (err.status === 401) {
          setErrorMsg('يرجى تسجيل الدخول أولاً لتتمكن من تفعيل الكود.');
        } else if (err.status === 422 || bodyCode === 'INVALID_CODE') {
          setErrorMsg('هذا الكود غير صالح أو تم استخدامه بالفعل. يرجى التأكد من الحروف المطبوعة على الكارت.');
        } else if (err.status === 409 || bodyCode === 'ALREADY_ENROLLED') {
          setErrorMsg('أنت مشترك بالفعل في هذا الكورس. لم يتم استهلاك الكود.');
        } else if (err.status === 429 || bodyCode === 'RATE_LIMITED') {
          setErrorMsg('لقد تجاوزت الحد الأقصى للمحاولات (5 محاولات). يرجى الانتظار 15 دقيقة.');
        } else {
          setErrorMsg(err.message || 'حدث خطأ أثناء تفعيل الكود.');
        }
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تفعيل الكود.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setSuccessData(null);
    setErrorMsg(null);
  };

  if (!initialized) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 animate-pulse text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-chip" />
        <div className="mx-auto mt-4 h-6 w-48 rounded bg-brand-chip" />
        <div className="mx-auto mt-8 h-48 w-full rounded-2xl bg-brand-chip" />
      </div>
    );
  }

  if (initialized && !enabled) {
    return (
      <>
        <PageTitle title="تفعيل كود الكورس | أكاديميا" />
        <div className="min-h-[calc(100vh-100px)] py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-xl">
            <div className="overflow-hidden rounded-3xl border border-brand-border bg-brand-surface p-10 text-center shadow-md">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Ticket className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-brand-text">ميزة تفعيل الأكواد غير مفعّلة</h1>
              <p className="mt-2 text-sm text-brand-muted">
                تم تعطيل نظام تفعيل الأكواد مؤقتاً في المنصة.
              </p>
              <div className="mt-6">
                <Link
                  href="/me/user"
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-primary/90 transition"
                >
                  العودة إلى الملف الشخصي
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="تفعيل كود الكورس | أكاديميا" />
      <div className="min-h-[calc(100vh-100px)] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-xl">
          {/* Breadcrumb / Back */}
          <div className="mb-6 flex items-center justify-between text-xs text-brand-muted">
            <Link
              href="/me/user"
              className="inline-flex items-center gap-1.5 font-medium hover:text-brand-primary transition"
            >
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              العودة إلى الملف الشخصي
            </Link>
            <span>أكاديميا للكيمياء</span>
          </div>

          <Reveal>
            {/* Main Card */}
            <div className="overflow-hidden rounded-3xl border border-brand-border bg-brand-surface p-6 sm:p-10 shadow-md">
              {!successData ? (
                /* ── Form State ── */
                <div>
                  {/* Card Header */}
                  <div className="text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                      <Ticket className="h-7 w-7" />
                    </span>
                    <h1 className="mt-4 text-2xl font-black text-brand-text sm:text-3xl">
                      تفعيل كود الكورس
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-brand-muted">
                      أدخل كود التفعيل المطبوع على كارت السنتر لتفعيل اشتراكك فوراً
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                      <label htmlFor="accessCodeInput" className="block text-center text-xs font-semibold text-brand-muted-strong mb-2">
                        كود الكارت (مكوّن من أرقام وحروف إنجليزية)
                      </label>
                      <div className="relative">
                        <input
                          id="accessCodeInput"
                          type="text"
                          dir="ltr"
                          value={code}
                          onChange={handleInputChange}
                          placeholder="XXXX-XXXX"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck="false"
                          disabled={loading}
                          className="w-full rounded-2xl border-2 border-brand-border bg-brand-bg px-4 py-3.5 text-center font-mono text-2xl sm:text-3xl font-black tracking-widest text-brand-text placeholder:text-brand-muted/40 uppercase outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                        {code && !loading && (
                          <button
                            type="button"
                            onClick={() => setCode('')}
                            className="absolute end-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-center text-[11px] text-brand-muted">
                        يتم تنسيق الفواصل تلقائياً (مثال: A7X3-K9M2)
                      </p>
                    </div>

                    {/* Error Alert */}
                    {errorMsg && (
                      <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-600">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p>{errorMsg}</p>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !code.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary py-3.5 text-sm sm:text-base font-bold text-white shadow-sm transition hover:bg-brand-primary/90 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          جارٍ التحقق وتفعيل الكورس...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          تفعيل الكود الآن
                        </>
                      )}
                    </button>
                  </form>

                  {/* Information Box */}
                  <div className="mt-8 rounded-2xl border border-brand-border/70 bg-brand-bg/60 p-4 text-xs text-brand-muted">
                    <p className="font-semibold text-brand-text mb-1">تعليمات مهمة:</p>
                    <ul className="list-disc list-inside space-y-1 leading-relaxed">
                      <li>الكود صالح للاستخدام مرة واحدة فقط مع حسابك الشخصي.</li>
                      <li>يمنحك الكود وصولاً كاملاً وفورياً لجميع محاضرات وامتحانات الدورة.</li>
                      <li>في حال واجهت أي مشكلة، يرجى مراجعة إدارة السنتر للتأكد من حالة الكارت.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* ── Success Celebration State ── */
                <div className="text-center py-2">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
                    <CheckCircle2 className="h-9 w-9" />
                  </span>

                  <h2 className="mt-5 text-2xl font-black text-brand-text sm:text-3xl">
                    مبروك! تم تفعيل اشتراكك بنجاح
                  </h2>
                  <p className="mt-1.5 text-sm text-brand-muted">
                    أهلاً بك يا {user?.name || 'طالبنا المتميز'}، تم فتح الدورة بالكامل لحسابك
                  </p>

                  {/* Course Details Card */}
                  <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-start">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-700">
                      <BookOpen className="h-4 w-4" />
                      <span>الدورة المفعلة</span>
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-brand-text">
                      {successData.courseName}
                    </p>

                    <div className="mt-4 flex items-center gap-2 border-t border-emerald-500/20 pt-3 text-xs text-brand-muted">
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        صلاحية الدورة: <strong>سنة كاملة</strong> (حتى {formatDate(successData.expiresAt)})
                      </span>
                    </div>
                  </div>

                  {/* Action CTAs */}
                  <div className="mt-8 flex flex-col gap-3">
                    <Link
                      href={successData.courseSlug ? `/course/${successData.courseSlug}` : `/me/user/courses`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary py-3.5 text-sm sm:text-base font-bold text-white shadow-sm transition hover:bg-brand-primary/90"
                    >
                      <BookOpen className="h-4 w-4" />
                      الانتقال إلى الكورس ومتابعة المشاهدة
                    </Link>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-2xl border border-brand-border py-2.5 text-xs font-semibold text-brand-muted hover:bg-brand-hover hover:text-brand-text transition"
                    >
                      تفعيل كود آخر
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}
