import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ReduxProvider } from '@/store/provider';
import { AuthInitializer } from '@/store/auth-initializer';
import { Toaster } from '@/components/ui/toaster';

// Tajawal self-hosted (app/fonts/*.woff2, arabic+latin, 400/500/700/800).
// next/font/google downloads from Google at BUILD time and fails the whole
// build when that fetch flakes — self-hosting keeps builds reproducible and
// removes the runtime CDN dependency entirely.
const tajawal = localFont({
  src: [
    { path: './fonts/tajawal-arabic-400.woff2', weight: '400' },
    { path: './fonts/tajawal-latin-400.woff2', weight: '400' },
    { path: './fonts/tajawal-arabic-500.woff2', weight: '500' },
    { path: './fonts/tajawal-latin-500.woff2', weight: '500' },
    { path: './fonts/tajawal-arabic-700.woff2', weight: '700' },
    { path: './fonts/tajawal-latin-700.woff2', weight: '700' },
    { path: './fonts/tajawal-arabic-800.woff2', weight: '800' },
    { path: './fonts/tajawal-latin-800.woff2', weight: '800' },
  ],
});

// Synchronous pre-paint theme init: reads the persisted choice and sets
// data-theme on <html> before stylesheets/hydration evaluate, so a stored
// dark preference never flashes light first. NOT a useEffect — those run
// after first paint. Default is light.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("akademya-theme");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light")}catch(e){document.documentElement.setAttribute("data-theme","light")}})()`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${tajawal.className} min-h-screen bg-background flex flex-col`}>
        <ReduxProvider>
          <AuthInitializer>
            <Navbar />
            <main className="grow pt-16">
              {children}
            </main>
            <Footer />
            <Toaster />
          </AuthInitializer>
        </ReduxProvider>
      </body>
    </html>
  );
}