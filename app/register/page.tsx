'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginSuccess, selectAuth } from '@/store/slices/authSlice';
import { registerUser } from '@/services/authService';
import { setCachedUser } from '@/lib/user-cache';
import { addNotification, setGlobalLoading } from '@/store/slices/uiSlice';

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'الاسم الأول يجب أن يكون حرفين على الأقل',
  }),
  lastName: z.string().min(2, {
    message: 'الاسم الأخير يجب أن يكون حرفين على الأقل',
  }),
  phone: z.string().min(11, {
    message: 'رقم الهاتف يجب أن يكون 11 رقم على الأقل',
  }),
  password: z.string().min(8, {
    message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
  }),
  confirmPassword: z.string(),
  grade: z.string({
    required_error: 'يرجى اختيار الصف الدراسي',
  }),
  email: z.string().email({
    message: 'يرجى إدخال بريد إلكتروني صحيح',
  }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

const GRADES = [
  { value: 'FIRST_SECONDARY', label: 'الصف الأول الثانوي' },
  { value: 'SECOND_SECONDARY', label: 'الصف الثاني الثانوي' },
  { value: 'THIRD_SECONDARY', label: 'الصف الثالث الثانوي' },
] as const;

const inputClass =
  'w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text outline-none transition placeholder:text-brand-muted focus:border-brand-primary';

function OrbitArt() {
  return (
    <svg viewBox="0 0 320 320" fill="none" className="h-full w-full max-w-sm text-white" aria-hidden="true">
      <circle cx="160" cy="160" r="14" fill="currentColor" opacity="0.9" />
      <ellipse cx="160" cy="160" rx="100" ry="44" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
      <ellipse cx="160" cy="160" rx="100" ry="44" stroke="currentColor" strokeWidth="1.6" opacity="0.5" transform="rotate(60 160 160)" />
      <ellipse cx="160" cy="160" rx="100" ry="44" stroke="currentColor" strokeWidth="1.6" opacity="0.5" transform="rotate(120 160 160)" />
      <circle cx="260" cy="160" r="6" fill="currentColor" />
      <circle cx="105" cy="72" r="6" fill="currentColor" />
      <circle cx="105" cy="248" r="6" fill="currentColor" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.ui.globalLoading);
  const notifications = useAppSelector(state => state.ui.notifications);
  const { initialized, isAuthenticated } = useAppSelector(selectAuth);

  // Check for error notifications
  const errorNotification = notifications.find(n => n.type === 'error');
  const [registered, setRegistered] = useState(false);

  // Hydration guard (credential-leak fix, same as login): the SSR HTML holds
  // a native <form> with named fields (incl. two password fields + phone) but
  // no onSubmit until React hydrates. A pre-hydration click/Enter would
  // native-submit as GET, leaking PII into the URL. Disabled-until-hydrated
  // blocks click + implicit submit; method="post" is the backstop.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Already signed in → send back home (after the app has finished checking the
  // session; before that `initialized` is false and we can't know yet). This
  // also fires right after a successful registration, which hydrates Redux and
  // therefore routes the new learner straight home instead of to /login.
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.replace('/');
    }
  }, [initialized, isAuthenticated, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      email: '',
      grade: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      dispatch(setGlobalLoading(true));

      // Prepare data for submission
      const name = `${values.firstName} ${values.lastName}`;
      const requestData = {
        name,
        email: values.email || '',
        phoneNumber: values.phone,
        grade: values.grade,
        password: values.password
      };

      // Register user using centralized auth service. Registration opens a
      // session on the backend (cookie-only), so hydrate Redux and cache now —
      // the guard effect then routes the learner home as a logged-in user.
      const { user } = await registerUser(requestData);
      dispatch(loginSuccess(user));
      setCachedUser(user);
      setRegistered(true);

      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'تم إنشاء الحساب بنجاح!',
        duration: 3000
      }));

    } catch (err: unknown) {
      console.error('Registration error:', err);

      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.',
        duration: 5000
      }));
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }

  const errors = form.formState.errors;

  return (
    <div className="-mt-16 grid min-h-dvh bg-brand-bg lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16 lg:order-2">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-lg font-extrabold text-brand-primary">أكاديميا</Link>
          <h1 className="mt-6 text-2xl font-extrabold text-brand-text">ابدأ مدارك الجديد</h1>
          <p className="mt-1.5 text-sm text-brand-muted">أنشئ حسابًا لتتابع دوراتك ونتائجك من أي جهاز.</p>

          <form onSubmit={form.handleSubmit(onSubmit)} method="post" className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first" className="mb-1.5 block text-sm font-semibold text-brand-text">الاسم الأول</label>
                <input id="reg-first" type="text" required placeholder="أحمد" {...form.register('firstName')} className={inputClass} />
                {errors.firstName && <p className="mt-1 text-xs text-brand-accent">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="reg-last" className="mb-1.5 block text-sm font-semibold text-brand-text">الاسم الأخير</label>
                <input id="reg-last" type="text" required placeholder="أسامة" {...form.register('lastName')} className={inputClass} />
                {errors.lastName && <p className="mt-1 text-xs text-brand-accent">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-semibold text-brand-text">رقم الهاتف</label>
              <input id="reg-phone" type="tel" required dir="ltr" placeholder="01XXXXXXXXX" {...form.register('phone')} className={inputClass} />
              {errors.phone && <p className="mt-1 text-xs text-brand-accent">{errors.phone.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-email" className="mb-1.5 block text-sm font-semibold text-brand-text">البريد الإلكتروني</label>
              <input id="reg-email" type="email" required placeholder="you@example.com" {...form.register('email')} className={inputClass} />
              {errors.email && <p className="mt-1 text-xs text-brand-accent">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-grade" className="mb-1.5 block text-sm font-semibold text-brand-text">الصف الدراسي</label>
              <div className="relative">
                <select id="reg-grade" required {...form.register('grade')} defaultValue="" className={inputClass + ' appearance-none pl-10'}>
                  <option value="" disabled>اختر الصف الدراسي</option>
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              {errors.grade && <p className="mt-1 text-xs text-brand-accent">{errors.grade.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-pass" className="mb-1.5 block text-sm font-semibold text-brand-text">كلمة المرور</label>
              <input id="reg-pass" type="password" required placeholder="٨ أحرف على الأقل" {...form.register('password')} className={inputClass} />
              {errors.password && <p className="mt-1 text-xs text-brand-accent">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-confirm" className="mb-1.5 block text-sm font-semibold text-brand-text">تأكيد كلمة المرور</label>
              <input id="reg-confirm" type="password" required placeholder="أعد كتابة كلمة المرور" {...form.register('confirmPassword')} className={inputClass} />
              {errors.confirmPassword && <p className="mt-1 text-xs text-brand-accent">{errors.confirmPassword.message}</p>}
            </div>

            {errorNotification && (
              <div className="rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-3 text-right text-sm text-brand-accent">
                {errorNotification.message}
              </div>
            )}

            {registered && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-right text-sm text-emerald-700">
                تم إنشاء الحساب بنجاح! جارٍ توجيهك إلى الرئيسية...
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !hydrated}
              className="w-full rounded-full bg-brand-primary py-3 text-sm font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-60"
            >
              {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-semibold text-brand-primary hover:underline">سجّل الدخول</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden items-center justify-center overflow-hidden bg-brand-ink p-10 lg:order-1 lg:flex">
        <div className="hero-glow absolute -inset-24 rounded-full bg-brand-accent/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col items-center text-center">
          <OrbitArt />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/70">
            كل مادة تدرسها تدور حول فكرة واحدة مركزية — نساعدك تكتشفها بوضوح.
          </p>
        </div>
      </div>
    </div>
  );
}
