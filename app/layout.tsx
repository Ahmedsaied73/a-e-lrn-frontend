import './globals.css';
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { ReduxProvider } from '@/store/provider';
import { Toaster } from '@/components/notification-toast';

const cairo = Cairo({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: 'الأستاذ لطفي زهران | مدرس الرياضيات',
  description: 'تعلم الرياضيات بأسهل الطرق مع الأستاذ لطفي زهران',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.className} geometric-background min-h-screen bg-[#0A0F1C] flex flex-col`}>
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <main className="flex-grow pt-20">
              {children}
            </main>
            <Footer />
            <Toaster />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}