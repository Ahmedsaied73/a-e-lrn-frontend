import type { Metadata } from 'next';
import { CourseCatalog } from '@/components/course-catalog';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `دورات الصف الثالث الثانوي ${siteConfig.subjectName}`,
  description: `تصفح دورات ${siteConfig.subjectName} للصف الثالث الثانوي — ${siteConfig.tagline}`,
};
export default function Grade3CoursesPage() { return <CourseCatalog />; }
