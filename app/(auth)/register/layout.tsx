import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'إنشاء حساب جديد',
  description: `أنشئ حسابًا لتتابع دوراتك ونتائجك من أي جهاز — ${siteConfig.tagline}`,
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
