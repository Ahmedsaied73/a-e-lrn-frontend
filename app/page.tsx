'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, MonitorPlay, BrainCircuit, Headphones, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { primary } from '@/lib/colors';
import { FadeIn, ScaleIn, StaggerGroup, StaggerItem } from '@/components/animations';

// ─── Grade Cards data ───────────────────────────────────────────
const GRADES = [
  {
    href: '/grades/1',
    img: '/grade1.png',
    title: 'الصف الأول الثانوي',
    desc: 'جميع كورسات الصف الأول الثانوي',
  },
  {
    href: '/grades/2',
    img: '/grade2.png',
    title: 'الصف الثاني الثانوي',
    desc: 'جميع كورسات الصف الثاني الثانوي',
  },
  {
    href: '/grades/3',
    img: '/grade3.png',
    title: 'الصف الثالث الثانوي',
    desc: 'جميع كورسات الصف الثالث الثانوي',
  },
];

// ─── Feature Cards data ──────────────────────────────────────────
const FEATURES = [
  {
    icon: <MonitorPlay className="w-8 h-8 text-primary" />,
    title: 'فيديوهات عالية الجودة',
    desc: 'شاهد الشرح في أي وقت وأي مكان بجودة احترافية لا تتعطل',
  },
  {
    icon: <BrainCircuit className="w-8 h-8 text-primary" />,
    title: 'اختبارات ذكية',
    desc: 'نختبرك في كل فرع بامتحانات تفاعلية تضمن وصولك لأعلى درجة',
  },
  {
    icon: <Headphones className="w-8 h-8 text-primary" />,
    title: 'دعم على مدار اليوم',
    desc: 'فريق دعم متكامل يرد على استفساراتك ويحل مشاكلك فوراً',
  },
];

export default function Home() {
  const isLoggedIn = useAppSelector(selectIsAuthenticated);

  return (
    <main className="w-full min-h-screen bg-surface" dir="rtl">

      {/* ══════════════════════════════════════════════════════════
           HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-white">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${primary.DEFAULT} 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Radial blue glow */}
        <div className="absolute -left-[20%] top-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl pointer-events-none" />
        {/* Ring decoration */}
        <div className="absolute -left-[10%] top-[5%] w-[700px] h-[700px] rounded-full border-[3px] border-primary/10 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full px-4 lg:px-12 py-16 relative z-10">
          <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">

            {/* ── Text Content ── */}
            <FadeIn className="flex-1 flex flex-col items-end text-right gap-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[13px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                منصة تعليمية متخصصة في الكيمياء
              </div>

              {/* Headline */}
              <h1 className="text-[40px] md:text-[56px] font-bold leading-tight text-on-surface">
                الأستاذ{' '}
                <span className="text-primary"> عبدالهادي موسى</span>
           
              </h1>

              {/* Sub-headline */}
              <p className="text-[18px] text-on-surface-variant leading-relaxed max-w-lg">
                في مادة الكيمياء ... مفيش صعوبة هتواجهك تاني. اكتشف متعة التعلم والفهم العميق
                بأسلوب مبتكر.
              </p>

              {/* CTA Row */}
              <div className="flex items-center gap-4 pt-2">
                {isLoggedIn ? (
                  <Link
                    href="/me/user/courses"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-xl font-semibold text-[16px] shadow-[0_4px_20px_rgba(32,123,255,0.35)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    كورساتي
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-xl font-semibold text-[16px] shadow-[0_4px_20px_rgba(32,123,255,0.35)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    انضم الآن
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                )}

                <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors duration-200 font-semibold text-[15px] group">
                  <span className="w-10 h-10 rounded-full border-2 border-primary-light flex items-center justify-center group-hover:bg-primary-hover/8 transition-all duration-200">
                    <Play className="w-4 h-4 text-primary fill-primary mr-[-2px]" />
                  </span>
                  شاهد المقدمة
                </button>
              </div>

              {/* Stats Row */}
              <div className="flex gap-8 pt-6 border-t border-outline-variant/40 w-full justify-end mt-2">
                {[
                  { value: '+15K', label: 'طالب مسجل' },
                  { value: '+50', label: 'دورة تدريبية' },
                  { value: '4.9', label: 'تقييم عام' },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-end gap-0.5">
                    <span className="text-[28px] font-bold text-primary leading-none">
                      {stat.value}
                    </span>
                    <span className="text-[12px] text-on-surface-variant">{stat.label}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* ── Teacher Image ── */}
            <ScaleIn className="flex-shrink-0 flex justify-center md:justify-start">
              <div className="relative">
                {/* Glow ring behind image */}
                <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl scale-110" />
                {/* Image container */}
                <div className="relative w-[260px] h-[260px] md:w-[420px] md:h-[420px] rounded-full overflow-hidden border-[4px] border-primary shadow-[0_8px_40px_rgba(32,123,255,0.25)]">
                  <Image
                    src="/teacher.png"
                    alt="الأستاذ عبد الهادي موسى"
               
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Floating accent bubble */}
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-primary-light rounded-2xl rotate-12 -z-10 opacity-20 blur-xl" />
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           FEATURES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 lg:px-12">
{/* Section header */}
          <FadeIn className="text-center mb-12">
            <h2 className="text-[32px] font-bold text-on-surface mb-3">
              <span className="text-primary">حابب</span> تعرفنا؟..
            </h2>
            <p className="text-[16px] text-on-surface-variant max-w-lg mx-auto">
              منصة تعليمية متكاملة تجمع بين الشرح المبسط والتقنية الحديثة
            </p>
          </FadeIn>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <StaggerItem key={f.title}>
                <div className="bg-surface-white rounded-2xl p-7 border border-outline-border shadow-level-2 hover:shadow-level-3 hover:-translate-y-1 transition-all duration-300 text-right h-full">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="text-[18px] font-bold text-on-surface mb-2">{f.title}</h3>
                <p className="text-[15px] text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           GRADE CARDS / COURSES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-12">
          {/* Section header */}
          <FadeIn className="flex items-center justify-between mb-10">
            <h2 className="text-[32px] font-bold text-on-surface">
              <span className="text-primary">السنوات</span> الدراسية
            </h2>
            <Link
              href="/grades/1"
              className="text-[14px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </FadeIn>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GRADES.map((grade) => (
              <StaggerItem key={grade.href}>
                <Link
                  href={grade.href}
                  className="group bg-surface-container-low rounded-2xl overflow-hidden border border-outline-border shadow-level-2 hover:shadow-[0_8px_32px_rgba(32,123,255,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={grade.img}
                    alt={grade.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                {/* Content */}
                <div className="p-5 flex flex-col gap-1 text-right flex-grow">
                  <h3 className="text-[18px] font-bold text-on-surface group-hover:text-primary transition-colors duration-200">
                    {grade.title}
                  </h3>
                  <p className="text-[14px] text-on-surface-variant">{grade.desc}</p>
                  <div className="flex items-center gap-1 text-primary text-[13px] font-semibold mt-3">
                    استعرض الكورسات
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           WHY US SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <ScaleIn className="relative w-full flex justify-center">
              <div className="relative w-full max-w-sm aspect-square">
                <Image
                  src="/brain.png"
                  alt="تعلم الكيمياء"
                  fill
                  className="object-contain"
                />
              </div>
            </ScaleIn>

            {/* Text side */}
            <FadeIn className="bg-surface-white rounded-2xl p-8 border border-outline-border shadow-level-2 text-right">
              <h2 className="text-[28px] font-bold text-on-surface mb-6">
                <span className="text-primary">تفتكر</span> هنا ليه..؟
              </h2>
              <div className="flex flex-col gap-4">
                {[
                  'مستر عبدالهادي موسى بيقدم طريقة سهلة لتعلم الكيمياء.',
                  'هتلاقي فيديوهات بتشرح لك المفاهيم بشكل بسيط وممتع، ومعاها تمارين تفاعلية تقدر تطبق اللي تعلمته.',
                  'هدفنا إنك تحب الكيمياء وتتعلمها بشكل ممتع وسهل.',
                ].map((text, i) => (
           
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <p className="text-[16px] text-on-surface-variant leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                {isLoggedIn ? (
                  <Link
                    href="/me/user/courses"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-xl font-semibold text-[16px] shadow-[0_4px_20px_rgba(32,123,255,0.3)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    كورساتي
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3.5 rounded-xl font-semibold text-[16px] shadow-[0_4px_20px_rgba(32,123,255,0.3)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    انضم لعيلتنا دلوقتي
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </main>
  );
}