import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

/**
 * Environment-aware sitemap — lists every public route plus one entry per
 * course (public previews, see Phase 3). Gated pages (/me/*, /admin/*,
 * video/quiz flows) are intentionally excluded.
 *
 * Course IDs come from the backend's public GET /courses at request time
 * (server-to-server via BACKEND_INTERNAL_URL, cached 24h). Any backend
 * outage degrades to the static entries — the sitemap never 500s.
 */
export const revalidate = 86400;

const STATIC_ROUTES = ['/', '/grades/1', '/grades/2', '/grades/3', '/login', '/register'];

function backendBase(): string {
  return (
    process.env.BACKEND_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:3005'
  );
}

async function fetchCourseIds(): Promise<number[]> {
  try {
    const res = await fetch(`${backendBase()}/courses?page=1&limit=100`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const raw: unknown = await res.json();
    const list: Array<{ id?: unknown }> = Array.isArray(raw)
      ? raw
      : (raw as { data?: Array<{ id?: unknown }> }).data ?? [];
    return list
      .map((c) => (typeof c.id === 'number' ? c.id : Number(c.id)))
      .filter((id) => Number.isSafeInteger(id) && id > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.8,
  }));
  const courseEntries: MetadataRoute.Sitemap = (await fetchCourseIds()).map(
    (id) => ({
      url: `${siteConfig.url}/course/${id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }),
  );
  return [...staticEntries, ...courseEntries];
}
