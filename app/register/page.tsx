'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

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
  password: z.string().min(6, {
    message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
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

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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
      setIsLoading(true);
      setError(null);
      
      // تجهيز البيانات للإرسال
      const name = `${values.firstName} ${values.lastName}`;
      const requestData = {
        name,
        email: values.email || '',
        phoneNumber: values.phone,
        grade: values.grade,
        password: values.password
      };
      
      // إرسال البيانات إلى الخادم
      const response = await fetch('http://localhost:3005/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل في تسجيل الحساب');
      }
      
      setSuccess(true);
      setIsLoading(false);
      
    } catch (err: any) {
      console.error('Form error:', err);
      setError(err.message || 'حدث خطأ أثناء معالجة النموذج. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="w-full md:w-1/2 max-w-md mx-auto md:mx-0">
        <div className="text-center md:text-right mb-8">
          <h1 className="text-3xl font-bold primary-text-gradient mb-2">أنشئ حسابك الآن!</h1>
          <p className="text-gray-400">
            ادخل بياناتك بشكل صحيح للحصول على أفضل تجربة داخل الموقع
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-end gap-2">
                    <span className='text-white'>الاسم الأول</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="الاسم الأول"
                      {...field}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-end gap-2">
                    <span className='text-white'>الاسم الأخير</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="الاسم الأخير"
                      {...field}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-end gap-2">
                    <span className='text-white'>رقم الهاتف</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      placeholder="01XXXXXXXXX"
                      {...field}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-end gap-2">
                    <span className='text-white'>البريد الإلكتروني (اختياري)</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      placeholder="example@example.com"
                      {...field}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-end gap-2">
                    <span className='text-white'>الصف الدراسي</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgb(var(--primary))]">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-right bg-background border-input hover:bg-accent hover:text-accent-foreground">
                        <SelectValue placeholder="اختر الصف الدراسي" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border-input">
                      <SelectItem value="FIRST_SECONDARY" className="text-right">الصف الأول الثانوي</SelectItem>
                      <SelectItem value="SECOND_SECONDARY" className="text-right">الصف الثاني الثانوي</SelectItem>
                      <SelectItem value="THIRD_SECONDARY" className="text-right">الصف الثالث الثانوي</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <span className='text-white'>كلمة السر</span>
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-end gap-2">
                    <span className='text-white'>تأكيد كلمة السر</span>
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

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500 text-right">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 rounded-md bg-green-500/10 border border-green-500/50 text-green-500 text-right">
                تم إنشاء الحساب بنجاح!
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-[rgb(var(--primary))] hover:bg-[rgb(var(--secondary))]"
              disabled={isLoading}
            >
              {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب!'}
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="text-[rgb(var(--primary))] hover:text-[rgb(var(--secondary))] hover:underline">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>

      <div className="w-full md:w-1/2 hidden md:block">
        <div className="relative h-[500px] w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/student.svg"
              alt="Student"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://img.freepik.com/free-vector/hand-drawn-flat-design-stack-books-illustration_23-2149341898.jpg?w=740&t=st=1713984369~exp=1713984969~hmac=2a7d4c4f5d9a9a9f9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a9a';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}