'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, MonitorPlay, BrainCircuit, Headphones, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { Reveal } from '@/components/reveal';
import { AnimatedNumber } from '@/components/animated-number';

// ─── Grade Cards data ────────────────────────────────────────────
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
    icon: <MonitorPlay className="h-[18px] w-[18px]" />,
    title: 'فيديوهات عالية الجودة',
    desc: 'شاهد الشرح في أي وقت وأي مكان بجودة احترافية لا تتعطل',
  },
  {
    icon: <BrainCircuit className="h-[18px] w-[18px]" />,
    title: 'اختبارات ذكية',
    desc: 'نختبرك في كل فرع بامتحانات تفاعلية تضمن وصولك لأعلى درجة',
  },
  {
    icon: <Headphones className="h-[18px] w-[18px]" />,
    title: 'دعم على مدار اليوم',
    desc: 'فريق دعم متكامل يرد على استفساراتك ويحل مشاكلك فوراً',
  },
];

// ─── Hero stats (reference order + one-shot count-up) ────────────
const STATS = [
  { value: 4.9, suffix: '', decimals: 1, label: 'تقييم عام' },
  { value: 50, suffix: '+', decimals: 0, label: 'دورة تدريبية' },
  { value: 15, suffix: 'K+', decimals: 0, label: 'طالب مسجل' },
];

export default function Home() {
  const isLoggedIn = useAppSelector(selectIsAuthenticated);

  return (
    <main className="w-full min-h-screen bg-brand-bg" dir="rtl">

      {/* ══════════════════════════════════════════════════════════
           HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="text-center lg:text-start">
            <span className="rounded-full bg-brand-secondary/10 px-3 py-1 text-xs font-semibold text-brand-secondary">
              منصة تعليمية متخصصة في الكيمياء
            </span>
            <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold leading-tight text-brand-text sm:text-5xl lg:mx-0">
              الأستاذ عبدالهادي موسى
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-brand-muted sm:text-lg lg:mx-0">
              في مادة الكيمياء ... مفيش صعوبة هتواجهك تاني. اكتشف متعة التعلم والفهم العميق
              بأسلوب مبتكر.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {isLoggedIn ? (
                <Link
                  href="/me/user/courses"
                  className="rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90"
                >
                  كورساتي
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90"
                >
                  انضم الآن
                </Link>
              )}
              <button className="inline-flex items-center gap-2 rounded-lg border border-brand-border-strong px-6 py-3 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-hover">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-primary text-white">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
                </span>
                شاهد المقدمة
              </button>
            </div>
          </Reveal>

          {/* ── Teacher photo (real content, reference frame) ── */}
          <Reveal delayMs={90} className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="hero-glow absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-brand-primary/15 to-brand-accent/15 blur-xl" aria-hidden="true" />
              <div className="relative aspect-square w-56 overflow-hidden rounded-[2rem] border-2 border-brand-secondary/40 bg-brand-surface/60 sm:w-72">
                <Image
                  src="/teacher.png"
                  alt="الأستاذ عبد الهادي موسى"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delayMs={160}>
          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-brand-border bg-brand-surface px-4 py-6 shadow-sm sm:px-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-extrabold text-brand-primary sm:text-3xl">
                  <AnimatedNumber value={s.value} suffix={s.suffix} decimals={s.decimals} />
                </dd>
                <p className="mt-1 text-xs text-brand-muted sm:text-sm">{s.label}</p>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* ══════════════════════════════════════════════════════════
           FEATURES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="border-y border-brand-border bg-brand-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-extrabold text-brand-text sm:text-3xl">
              حابب تعرفنا؟..
            </h2>
            <p className="mt-3 text-brand-muted">
              منصة تعليمية متكاملة تجمع بين الشرح المبسط والتقنية الحديثة
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delayMs={i * 80}>
                <div className="group h-full rounded-xl border border-brand-border bg-brand-bg p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-primary/10 text-brand-primary transition-transform duration-300 group-hover:scale-110">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-brand-text">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           GRADE CARDS / COURSES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-brand-bg">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Section header */}
          <Reveal className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-extrabold text-brand-text sm:text-3xl">
              السنوات الدراسية
            </h2>
            <Link
              href="/grades/1"
              className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GRADES.map((grade, i) => (
              <Reveal key={grade.href} delayMs={i * 80}>
                <Link
                  href={grade.href}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-surface transition hover:-translate-y-0.5 hover:shadow-md"
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
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                  </div>
                  {/* Content */}
                  <div className="p-5 flex flex-col gap-1 text-right grow">
                    <h3 className="text-sm font-bold text-brand-text">
                      {grade.title}
                    </h3>
                    <p className="text-sm text-brand-muted-strong">{grade.desc}</p>
                    <div className="flex items-center gap-1 text-brand-primary text-[13px] font-semibold mt-3">
                      استعرض الكورسات
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           WHY US SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="border-y border-brand-border bg-brand-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <Reveal className="relative w-full flex justify-center">
              <div className="relative w-full max-w-sm aspect-square">
                <Image
                  src="/brain.png"
                  alt="تعلم الكيمياء"
                  fill
                  className="object-contain"
                />
              </div>
            </Reveal>

            {/* Text side */}
            <Reveal delayMs={90} className="rounded-2xl border border-brand-border bg-brand-bg p-8 shadow-sm text-right">
              <h2 className="text-2xl font-extrabold text-brand-text sm:text-3xl mb-6">
                تفتكر هنا ليه..؟
              </h2>
              <div className="flex flex-col gap-4">
                {[
                  'مستر عبدالهادي موسى بيقدم طريقة سهلة لتعلم الكيمياء.',
                  'هتلاقي فيديوهات بتشرح لك المفاهيم بشكل بسيط وممتع، ومعاها تمارين تفاعلية تقدر تطبق اللي تعلمته.',
                  'هدفنا إنك تحب الكيمياء وتتعلمها بشكل ممتع وسهل.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-brand-primary" />
                    </div>
                    <p className="text-[16px] text-brand-muted-strong leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                {isLoggedIn ? (
                  <Link
                    href="/me/user/courses"
                    className="rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90"
                  >
                    كورساتي
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90"
                  >
                    انضم لعيلتنا دلوقتي
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           CTA BAND (reference pattern — accent does the work here)
      ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <Reveal>
          <h2 className="text-2xl font-extrabold text-brand-text sm:text-3xl">
            ابدأ رحلتك التعليمية اليوم
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-muted">
            تصفّح الدورات المتاحة واختر ما يناسب مستواك، وابدأ بخطوات واضحة نحو التميّز.
          </p>
          <Link
            href="/grades/1"
            className="mt-6 inline-flex items-center rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-accent/90"
          >
            تصفح الدورات المتاحة
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
