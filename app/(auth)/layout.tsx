import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

/**
 * Shared metadata for the chromeless auth screens. NOTE: per-route layouts
 * with metadata under this group break production prerender on Next 13.5.11
 * (error-boundary client-manifest failure), so both routes share this one
 * group layout instead of carrying their own.
 */
/**
 * Shared layout for the chromeless auth screens. NOTE: per-route layouts with
 * metadata under this group break production prerender on Next 13.5.11
 * (error-boundary client-manifest failure), and this is a route GROUP — one
 * shared metadata export here would give /login and /register the same title.
 * Unique titles therefore come from a tiny <title> element inside each page
 * (login/page.tsx, register/page.tsx), which React hoists to <head>. The
 * metadata below only sets a fallback description; each page overrides the
 * title itself.
 */
export const metadata: Metadata = {
  description: `سجّل الدخول أو أنشئ حسابًا لمتابعة دوراتك — ${siteConfig.tagline}`,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
