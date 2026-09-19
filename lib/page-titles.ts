/**
 * Central page titles — lib/page-titles.ts
 *
 * Single source of truth for every distinct browser tab title. Each entry is
 * unique by design: two keys must never hold the same Arabic string, so tabs,
 * history entries, and screen readers can always tell pages apart.
 *
 * Used two ways:
 *  1. Server-side `metadata` exports (root-level `PAGE_TITLES` entries) via
 *     Next's title template in app/layout.tsx → rendered as
 *     `<title> | الأستاذ عبد الهادي موسى`.
 *  2. The shared <PageTitle> component (components/page-title.tsx) for
 *     client-rendered pages (admin console, account area, course player),
 *     where Next 13.5 cannot export `metadata`. It composes the final
 *     `document.title` itself, so pass the composed form (`ADMIN_*` and
 *     `*Title(course/video)` helpers), not a bare PAGE_TITLES key.
 */
import { siteConfig } from '@/lib/site-config';

export const PAGE_TITLES = {
  login: 'تسجيل الدخول',
  register: 'إنشاء حساب جديد',
  profile: 'الملف الشخصي',
  courses: 'كورساتي',
  assignments: 'الواجبات',
  achievements: 'الإنجازات',
  subscriptions: 'الاشتراكات',
  invoice: 'الاشتراك في الدورة',
  video: 'مشاهدة المحاضرة',
  assignmentSubmit: 'تقديم الواجب',
  quizRun: 'الاختبار جارٍ',
  quizResult: 'نتيجة الاختبار',
  paymentResult: 'نتيجة عملية الدفع',
} as const;

const ADMIN_SUFFIX = 'لوحة التحكم';

/** Compose an admin console title. Admin pages are client components, so they set document.title directly (no root title template applies). */
export function adminTitle(section: string): string {
  return `${section} | ${ADMIN_SUFFIX} | ${siteConfig.teacherName}`;
}

/** Compose the course-detail tab title once the course name is known. */
export function courseTitle(courseName: string): string {
  return `${courseName} | دورات ${siteConfig.subjectName} | ${siteConfig.teacherName}`;
}

/** Compose the video-player tab title once the video name is known. */
export function videoTitle(videoName: string): string {
  return `${videoName} | محاضرات ${siteConfig.subjectName} | ${siteConfig.teacherName}`;
}
