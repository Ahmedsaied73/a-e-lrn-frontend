import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

/**
 * Shared metadata for the chromeless auth screens. NOTE: per-route layouts
 * with metadata under this group break production prerender on Next 13.5.11
 * (error-boundary client-manifest failure), so both routes share this one
 * group layout instead of carrying their own.
 */
export const metadata: Metadata = {
  title: 'الحساب',
  description: `سجّل الدخول أو أنشئ حسابًا لمتابعة دوراتك — ${siteConfig.tagline}`,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
