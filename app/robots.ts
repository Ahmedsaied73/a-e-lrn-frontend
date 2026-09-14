import type { MetadataRoute } from 'next';

/**
 * Mirrors the reference `robots.txt` route: allow everything, advertise
 * the sitemap. Cached by intermediaries for a day, same as the source.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
