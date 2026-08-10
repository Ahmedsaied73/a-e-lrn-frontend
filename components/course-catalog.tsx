'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CourseListItem, fetchAllCourses } from '@/services/courseService';

export function CourseCatalog() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCourses().then((result) => setCourses(result.data)).catch(() => setCourses([])).finally(() => setLoading(false));
  }, []);

  return <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
    <div className="mb-10 text-center">
      <h1 className="text-headline-lg text-on-surface">الدورات المتاحة</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">اختر دورتك وابدأ التعلّم بخطوات واضحة.</p>
    </div>
    {loading ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="جارٍ تحميل الدورات">{[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-lg bg-surface-container" />)}</div> : courses.length ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => <Link key={course.id} href={`/course/${course.id}`} className="group overflow-hidden rounded-lg bg-white shadow-level-2 transition duration-200 hover:-translate-y-1 hover:shadow-level-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <div className="relative h-48 overflow-hidden bg-surface-container"><Image src={course.thumbnail || '/placeholder-course.jpg'} alt={course.title} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition duration-300 group-hover:scale-105" /></div>
        <div className="p-5"><div className="mb-3 flex items-center gap-2 text-caption text-secondary-color"><GraduationCap className="h-4 w-4" />{course.grade || 'دورة تعليمية'}</div><h2 className="line-clamp-2 text-xl font-bold leading-8 text-on-surface">{course.title}</h2><p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-6 text-on-surface-variant">{course.description || 'محتوى تعليمي منظم لمساعدتك على التقدم بثقة.'}</p><div className="mt-5 flex items-center justify-between border-t border-outline-variant/50 pt-4 text-sm"><span className="font-bold text-primary">{course.price && course.price > 0 ? `${course.price} جنيه` : 'مجاني'}</span><span className="inline-flex items-center gap-1 font-semibold text-primary">عرض الدورة <BookOpen className="h-4 w-4" /></span></div></div>
      </Link>)}
    </div> : <div className="rounded-lg bg-white px-6 py-16 text-center shadow-level-1"><Clock className="mx-auto h-8 w-8 text-secondary-color" /><h2 className="mt-4 text-xl font-bold text-on-surface">لا توجد دورات متاحة حالياً</h2><p className="mt-2 text-on-surface-variant">سيتم عرض الدورات الجديدة هنا فور إضافتها.</p></div>}
  </section>;
}
