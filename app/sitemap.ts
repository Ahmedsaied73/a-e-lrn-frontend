import type { MetadataRoute } from 'next';

/**
 * Mirrors the reference `sitemap.xml` route: the public landing page,
 * refreshed weekly. Authenticated/app pages are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
