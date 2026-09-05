'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, MonitorPlay, BrainCircuit, Headphones, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

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
    icon: <MonitorPlay className="w-8 h-8 text-[#207bff]" />,
    title: 'فيديوهات عالية الجودة',
    desc: 'شاهد الشرح في أي وقت وأي مكان بجودة احترافية لا تتعطل',
  },
  {
    icon: <BrainCircuit className="w-8 h-8 text-[#207bff]" />,
    title: 'اختبارات ذكية',
    desc: 'نختبرك في كل فرع بامتحانات تفاعلية تضمن وصولك لأعلى درجة',
  },
  {
    icon: <Headphones className="w-8 h-8 text-[#207bff]" />,
    title: 'دعم على مدار اليوم',
    desc: 'فريق دعم متكامل يرد على استفساراتك ويحل مشاكلك فوراً',
  },
];

export default function Home() {
  const isLoggedIn = useAppSelector(selectIsAuthenticated);

  return (
    <main className="w-full min-h-screen bg-[#f7f9fc]" dir="rtl">

      {/* ══════════════════════════════════════════════════════════
           HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-white">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #207bff 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Radial blue glow */}
        <div className="absolute -left-[20%] top-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#207bff]/10 to-transparent blur-3xl pointer-events-none" />
        {/* Ring decoration */}
        <div className="absolute -left-[10%] top-[5%] w-[700px] h-[700px] rounded-full border-[3px] border-[#207bff]/10 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full px-4 lg:px-12 py-16 relative z-10">
          <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">

            {/* ── Text Content ── */}
            <div className="flex-1 flex flex-col items-end text-right gap-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-[#207bff]/10 text-[#207bff] px-4 py-1.5 rounded-full text-[13px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#207bff] animate-pulse" />
                منصة تعليمية متخصصة في الكيمياء
              </div>

              {/* Headline */}
              <h1 className="text-[40px] md:text-[56px] font-bold leading-tight text-[#191c1e]">
                الأستاذ{' '}
                <span className="text-[#207bff]"> عبدالهادي موسى</span>
           
              </h1>

              {/* Sub-headline */}
              <p className="text-[18px] text-[#414754] leading-relaxed max-w-lg">
                في مادة الكيمياء ... مفيش صعوبة هتواجهك تاني. اكتشف متعة التعلم والفهم العميق
                بأسلوب مبتكر.
              </p>

              {/* CTA Row */}
              <div className="flex items-center gap-4 pt-2">
                {isLoggedIn ? (
                  <Link
                    href="/me/user/courses"
                    className="inline-flex items-center gap-2 bg-[#207bff] hover:bg-[#1a6bdf] text-white px-7 py-3.5 rounded-xl font-semibold text-[16px] shadow-[0_4px_20px_rgba(32,123,255,0.35)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    كورساتي
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-[#207bff] hover:bg-[#1a6bdf] text-white px-7 py-3.5 rounded-xl font-semibold text-[16px] shadow-[0_4px_20px_rgba(32,123,255,0.35)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    انضم الآن
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                )}

                <button className="flex items-center gap-2 text-[#414754] hover:text-[#207bff] transition-colors duration-200 font-semibold text-[15px] group">
                  <span className="w-10 h-10 rounded-full border-2 border-[#4ea5ff] flex items-center justify-center group-hover:bg-[#207bff]/8 transition-all duration-200">
                    <Play className="w-4 h-4 text-[#207bff] fill-[#207bff] mr-[-2px]" />
                  </span>
                  شاهد المقدمة
                </button>
              </div>

              {/* Stats Row */}
              <div className="flex gap-8 pt-6 border-t border-[#c1c6d7]/40 w-full justify-end mt-2">
                {[
                  { value: '+15K', label: 'طالب مسجل' },
                  { value: '+50', label: 'دورة تدريبية' },
                  { value: '4.9', label: 'تقييم عام' },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-end gap-0.5">
                    <span className="text-[28px] font-bold text-[#207bff] leading-none">
                      {stat.value}
                    </span>
                    <span className="text-[12px] text-[#414754]">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Teacher Image ── */}
            <div className="flex-shrink-0 flex justify-center md:justify-start">
              <div className="relative">
                {/* Glow ring behind image */}
                <div className="absolute inset-0 rounded-full bg-[#207bff]/15 blur-2xl scale-110" />
                {/* Image container */}
                <div className="relative w-[260px] h-[260px] md:w-[420px] md:h-[420px] rounded-full overflow-hidden border-[4px] border-[#207bff] shadow-[0_8px_40px_rgba(32,123,255,0.25)]">
                  <Image
                    src="/teacher.png"
                    alt="الأستاذ عبد الهادي موسى"
               
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Floating accent bubble */}
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#4ea5ff] rounded-2xl rotate-12 -z-10 opacity-20 blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           FEATURES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f7f9fc]">
        <div className="max-w-7xl mx-auto px-4 lg:px-12">
          {/* Section header */}
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-bold text-[#191c1e] mb-3">
              <span className="text-[#207bff]">حابب</span> تعرفنا؟..
            </h2>
            <p className="text-[16px] text-[#414754] max-w-lg mx-auto">
              منصة تعليمية متكاملة تجمع بين الشرح المبسط والتقنية الحديثة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-7 border border-[#e6e8eb] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(32,123,255,0.1)] hover:-translate-y-1 transition-all duration-300 text-right"
              >
                <div className="w-14 h-14 bg-[#207bff]/10 rounded-xl flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="text-[18px] font-bold text-[#191c1e] mb-2">{f.title}</h3>
                <p className="text-[15px] text-[#414754] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           GRADE CARDS / COURSES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-12">
          {/* Section header */}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-[32px] font-bold text-[#191c1e]">
              <span className="text-[#207bff]">السنوات</span> الدراسية
            </h2>
            <Link
              href="/grades/1"
              className="text-[14px] font-semibold text-[#207bff] hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GRADES.map((grade) => (
              <Link
                key={grade.href}
                href={grade.href}
                className="group bg-[#f2f4f7] rounded-2xl overflow-hidden border border-[#e6e8eb] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(32,123,255,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
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
                  <h3 className="text-[18px] font-bold text-[#191c1e] group-hover:text-[#207bff] transition-colors duration-200">
                    {grade.title}
                  </h3>
                  <p className="text-[14px] text-[#414754]">{grade.desc}</p>
                  <div className="flex items-center gap-1 text-[#207bff] text-[13px] font-semibold mt-3">
                    استعرض الكورسات
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           WHY US SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#f7f9fc]">
        <div className="max-w-7xl mx-auto px-4 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <div className="relative w-full flex justify-center">
              <div className="relative w-full max-w-sm aspect-square">
                <Image
                  src="/brain.png"
                  alt="تعلم الكيمياء"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Text side */}
            <div className="bg-white rounded-2xl p-8 border border-[#e6e8eb] shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-right">
              <h2 className="text-[28px] font-bold text-[#191c1e] mb-6">
                <span className="text-[#207bff]">تفتكر</span> هنا ليه..؟
              </h2>
              <div className="flex flex-col gap-4">
                {[
                  'مستر عبدالهادي موسى بيقدم طريقة سهلة لتعلم الكيمياء.',
                  'هتلاقي فيديوهات بتشرح لك المفاهيم بشكل بسيط وممتع، ومعاها تمارين تفاعلية تقدر تطبق اللي تعلمته.',
                  'هدفنا إنك تحب الكيمياء وتتعلمها بشكل ممتع وسهل.',
                ].map((text, i) => (
           
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#207bff]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#207bff]" />
                    </div>
                    <p className="text-[16px] text-[#414754] leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                {isLoggedIn ? (
                  <Link
                    href="/me/user/courses"
                    className="inline-flex items-center gap-2 bg-[#207bff] hover:bg-[#1a6bdf] text-white px-7 py-3.5 rounded-xl font-semibold text-[16px] shadow-[0_4px_20px_rgba(32,123,255,0.3)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    كورساتي
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-[#207bff] hover:bg-[#1a6bdf] text-white px-7 py-3.5 rounded-xl font-semibold text-[16px] shadow-[0_4px_20px_rgba(32,123,255,0.3)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    انضم لعيلتنا دلوقتي
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}