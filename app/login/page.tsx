'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { loginUser } from '@/services/authService';
import { addNotification, setGlobalLoading } from '@/store/slices/uiSlice';

const formSchema = z.object({
  email: z.string().email({
    message: 'يرجى إدخال بريد إلكتروني صحيح',
  }),
  password: z.string().min(6, {
    message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.ui.globalLoading);
  const notifications = useAppSelector(state => state.ui.notifications);
  
  // Check for error notifications
  const errorNotification = notifications.find(n => n.type === 'error');
  
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
      
      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'تم تسجيل الدخول بنجاح!',
        duration: 3000
      }));
      
      // Redirect to home page
      router.push('/');
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Show error notification
      dispatch(addNotification({
        type: 'error',
        message: err.message || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.',
        duration: 5000
      }));
      
      dispatch(setGlobalLoading(false));
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="w-full md:w-1/2 max-w-md mx-auto md:mx-0">
        <div className="text-center md:text-right mb-8">
          <h1 className="text-3xl font-bold primary-text-gradient mb-2">تسجيل الدخول</h1>
          <p className="text-gray-400">
            قم بتسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-end gap-2">
                    <span className='text-white'>البريد الإلكتروني</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@example.com"
                      {...field}
                      className="text-right"
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-end gap-2">
                    <span className='text-white'>كلمة المرور</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="******"
                      {...field}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>

            {errorNotification && (
              <p className="text-red-500 text-sm text-center">{errorNotification.message}</p>
            )}

            <p className="text-center text-sm text-gray-400 mt-4">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-[rgb(var(--primary))] hover:underline">
                انشئ حساب الآن!
              </Link>
            </p>
          </form>
        </Form>
      </div>

      <div className="hidden lg:block w-1/2">
        <div className="relative h-[600px] w-full">
          <Image
            src="/student-illustration.svg"
            alt="Student illustration"
            layout="fill"
            objectFit="contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}