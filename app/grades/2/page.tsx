import type { Metadata } from 'next';
import { CourseCatalog } from '@/components/course-catalog';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `دورات الصف الثاني الثانوي ${siteConfig.subjectName}`,
  description: `تصفح دورات ${siteConfig.subjectName} للصف الثاني الثانوي — ${siteConfig.tagline}`,
};
export default function Grade2CoursesPage() { return <CourseCatalog />; }
