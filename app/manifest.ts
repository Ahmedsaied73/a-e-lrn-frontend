import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

/**
 * Web App Manifest — served by Next.js at /manifest.webmanifest.
 * White-label: name/short_name follow siteConfig (subject short name
 * respects the ~12 character install-label limit).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.teacherName} — ${siteConfig.subjectName}`,
    short_name: siteConfig.subjectName,
    description: siteConfig.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f6f8',
    theme_color: '#4685CE',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
