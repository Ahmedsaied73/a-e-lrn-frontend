import './globals.css';
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ReduxProvider } from '@/store/provider';
import { Toaster } from '@/components/ui/toaster';

const cairo = Cairo({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: 'الأستاذ عبد الهادي موسى | مدرس الكيمياء',
  description: 'تعلم الكيمياء بأسهل الطرق مع الأستاذ عبد الهادي موسى',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.className} min-h-screen bg-background flex flex-col`}>
        <ReduxProvider>
          <Navbar />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}