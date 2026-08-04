import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { ReduxProvider } from '@/store/provider';
import { Toaster } from '@/components/ui/toaster';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: 'JAW Academy | منصة تعليمية ذكية',
  description:
    'JAW Academy — منصة تعليمية متكاملة لطلاب الثانوية العامة: شرح احترافي، مراجعات ذكية، واختبارات تفاعلية مدعومة بالذكاء الاصطناعي.',
};

export const viewport: Viewport = {
  themeColor: '#207BFF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="bg-background" suppressHydrationWarning>
      <body className={`${cairo.className} min-h-screen bg-background text-foreground flex flex-col antialiased`}>
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Navbar />
            <main className="flex-grow pt-20">{children}</main>
            <Footer />
            <Toaster />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
