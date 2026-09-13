'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { selectAuth } from '@/store/slices/authSlice';
import { loginUser } from '@/services/authService';
import { setCachedUser } from '@/lib/user-cache';
import { addNotification, setGlobalLoading } from '@/store/slices/uiSlice';

const formSchema = z.object({
  email: z.string().email({
    message: 'يرجى إدخال بريد إلكتروني صحيح',
  }),
  password: z.string().min(6, {
    message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  }),
});

function MoleculeArt() {
  return (
    <svg viewBox="0 0 320 320" fill="none" className="h-full w-full max-w-sm text-white" aria-hidden="true">
      <g opacity="0.9">
        <circle cx="120" cy="120" r="26" stroke="currentColor" strokeWidth="2" />
        <circle cx="220" cy="90" r="18" stroke="currentColor" strokeWidth="2" />
        <circle cx="230" cy="200" r="30" stroke="currentColor" strokeWidth="2" />
        <circle cx="110" cy="230" r="16" stroke="currentColor" strokeWidth="2" />
        <path d="M142 108 202 96M138 142 208 188M150 224 200 214M100 214 92 130" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.ui.globalLoading);
  const notifications = useAppSelector(state => state.ui.notifications);
  const { initialized, isAuthenticated } = useAppSelector(selectAuth);

  // Hydration guard (credential-leak fix): the SSR HTML contains a native
  // <form> with named fields but no attached onSubmit until React hydrates.
  // A click/Enter before hydration would native-submit as GET, putting the
  // email AND password in the URL (history, proxy logs). The submit button
  // stays disabled until hydration, which blocks both click and implicit
  // (Enter-key) submission in all modern browsers. `method="post"` below is
  // the backstop: even a non-JS submit sends a body, never a query string.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Check for error notifications
  const errorNotification = notifications.find(n => n.type === 'error');

  // Already signed in → send back home (after the app has finished checking the
  // session; before that `initialized` is false and we can't know yet).
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.replace('/');
    }
  }, [initialized, isAuthenticated, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check for error message stored in localStorage
  useEffect(() => {
    const authError = localStorage.getItem('authError');
    if (authError) {
      // Add error notification
      dispatch(addNotification({
        type: 'error',
        message: authError,
        duration: 5000
      }));
      // Clear error message after displaying it
      localStorage.removeItem('authError');
    }
  }, [dispatch]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      dispatch(setGlobalLoading(true));

      // Use the auth service for login
      const userData = await loginUser(values);

      // Update Redux state
      dispatch(loginSuccess(userData.user));
      setCachedUser(userData.user);

      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'تم تسجيل الدخول بنجاح!',
        duration: 3000
      }));

      // Redirect to home page
      router.push('/');

    } catch (err: unknown) {
      console.error('Login error:', err);

      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.',
        duration: 5000
      }));

      dispatch(setGlobalLoading(false));
    }
  }

  function handleForgotPassword() {
    dispatch(addNotification({
      type: 'info',
      message: 'خدمة استعادة كلمة المرور ستتاح قريباً.',
      duration: 4000
    }));
  }

  return (
    <div className="-mt-16 grid min-h-dvh bg-brand-bg lg:grid-cols-2">
      <div className="relative hidden items-center justify-center overflow-hidden bg-brand-ink p-10 lg:flex">
        <div className="hero-glow absolute -inset-24 rounded-full bg-brand-primary/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col items-center text-center">
          <MoleculeArt />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/70">
            كل جلسة تسجيل دخول هي رابطة جديدة بينك وبين ما تعلمته — أكمل من حيث توقفت.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-lg font-extrabold text-brand-primary">أكاديميا</Link>
          <h1 className="mt-6 text-2xl font-extrabold text-brand-text">مرحبًا بعودتك</h1>
          <p className="mt-1.5 text-sm text-brand-muted">سجّل الدخول لمتابعة دوراتك وتقدمك.</p>

          <form onSubmit={form.handleSubmit(onSubmit)} method="post" className="mt-8 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-brand-text">البريد الإلكتروني</label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="you@example.com"
                {...form.register('email')}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text outline-none transition placeholder:text-brand-muted focus:border-brand-primary"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-brand-accent">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-semibold text-brand-text">كلمة المرور</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                {...form.register('password')}
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-sm text-brand-text outline-none transition placeholder:text-brand-muted focus:border-brand-primary"
              />
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-brand-accent">{form.formState.errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !hydrated}
              className="w-full rounded-full bg-brand-primary py-3 text-sm font-bold text-white transition hover:bg-brand-primary/90 disabled:opacity-60"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {errorNotification && (
            <p className="mt-4 text-center text-sm text-brand-accent">{errorNotification.message}</p>
          )}

          <p className="mt-6 text-center text-sm text-brand-muted">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="font-semibold text-brand-primary hover:underline">أنشئ حسابًا</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
