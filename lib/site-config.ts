/**
 * White-label site configuration — lib/site-config.ts
 *
 * Single source of truth for every teacher-visible brand string and URL used
 * in metadata, OpenGraph cards, manifest, sitemap, and JSON-LD. Values come
 * from the environment (see .env.example); the Arabic literals below are
 * build-time fallbacks for local dev, NOT per-teacher overrides.
 *
 * NOTE on NEXT_PUBLIC_*: these strings render inside client components
 * (navbar, footer, landing CTAs), so they must be build-time public. They
 * are public by design — never put secrets here. Changing any variable
 * takes effect on rebuild/restart, with zero code changes.
 */
export const siteConfig = {
  /** Canonical public origin. Server-only (sitemap, metadataBase, JSON-LD). */
  url: (() => {
    const raw = (process.env.FRONTEND_URL ?? '').trim() || 'http://localhost:3000';
    try {
      // Must be a full origin incl. protocol, e.g. https://my-app.vercel.app.
      // A bare word like "anonymousTeacher" throws ERR_INVALID_URL and kills
      // `next build` at "Collecting page data" (root layout metadataBase).
      return new URL(raw).origin;
    } catch {
      if (process.env.NODE_ENV === 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[site-config] Invalid FRONTEND_URL=${JSON.stringify(raw)} — falling back to http://localhost:3000. Set it to https://<your-app>.vercel.app`);
      }
      return 'http://localhost:3000';
    }
  })(),

  /** Primary brand. Students search for this name — it anchors every title. */
  teacherName:
    process.env.NEXT_PUBLIC_TEACHER_NAME ?? 'الأستاذ عبد الهادي موسى',

  /** Short subject label. Also feeds manifest short_name (12-char limit). */
  subjectName: process.env.NEXT_PUBLIC_SUBJECT_NAME ?? 'الكيمياء',

  /** Default title + meta description + social-card subtitle. */
  tagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    'تعلم الكيمياء بأسهل الطرق مع الأستاذ عبد الهادي موسى',

  /** Fixed platform mark (navbar/footer). Per owner decision: NOT white-labeled. */
  brandMark: 'أكاديميا',
} as const;

/** `%s | ${teacherName}` — shared by every static/generate metadata export. */
export function withTeacher(title: string): string {
  return `${title} | ${siteConfig.teacherName}`;
}
