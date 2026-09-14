import type { Metadata } from 'next';
import { CourseCatalog } from '@/components/course-catalog';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `دورات الصف الأول الثانوي ${siteConfig.subjectName}`,
  description: `تصفح دورات ${siteConfig.subjectName} للصف الأول الثانوي — ${siteConfig.tagline}`,
};
export default function Grade1CoursesPage() { return <CourseCatalog />; }
