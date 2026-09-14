import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

/**
 * Mirrors the reference `robots.txt` route: allow everything, advertise
 * the sitemap. Cached by intermediaries for a day, same as the source.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
