import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description: `سجّل الدخول لمتابعة دوراتك وتقدمك — ${siteConfig.tagline}`,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
