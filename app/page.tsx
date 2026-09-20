import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import { AnimatedNumber } from '@/components/animated-number';
import { AiAssistantDemo } from '@/components/ai-assistant-demo';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: siteConfig.tagline },
  description: siteConfig.tagline,
};

const STATS = [
  { value: 4.9, suffix: '', decimals: 1, label: 'تقييم عام' },
  { value: 50, suffix: '+', decimals: 0, label: 'دورة تدريبية' },
  { value: 15, suffix: 'K+', decimals: 0, label: 'طالب مسجل' },
];

const FEATURES = [
  {
    title: 'دروس فيديو واضحة',
    body: 'محاضرات مقسمة بخطوات منطقية، مع متابعة تلقائية لتقدمك في كل درس.',
  },
  {
    title: 'اختبارات وتصحيح فوري',
    body: 'اختبارات قصيرة بعد كل وحدة مع نتيجة وتحليل أداء لحظي.',
  },
  {
    title: 'شهادات معتمدة',
    body: 'احصل على شهادة إتمام بعد اجتياز اختبارات الدورة بنجاح.',
  },
  {
    title: 'متابعة أولياء الأمور',
    body: 'تقارير دورية توضح تقدم الطالب ونتائجه في كل مادة.',
  },
];

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-brand-bg pt-16" dir="rtl">

      {/* ── HERO ── */}
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
              في مادة الكيمياء… مفيش صعوبة هتواجهك تاني. اكتشف التعلم والفهم العميق بأسلوب متطور.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/grades/1"
                className="rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90"
              >
                كورساتي
              </Link>
              <button className="inline-flex items-center gap-2 rounded-lg border border-brand-border-strong px-6 py-3 text-sm font-semibold text-brand-muted-strong transition hover:bg-brand-hover">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-primary text-white">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
                </span>
                شاهد المقدمة
              </button>
            </div>
          </Reveal>

          <Reveal delayMs={90} className="flex justify-center lg:justify-end">
            {/* Teacher photo slot — replace the placeholder with a real portrait (recommended ~800x800, centered face, transparent or brand-bg background works best). */}
            <div className="relative flex aspect-square w-56 items-center justify-center rounded-[2rem] border-2 border-dashed border-brand-secondary/40 bg-brand-surface/60 text-center backdrop-blur sm:w-72">
              <div className="hero-glow absolute -inset-3 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-primary/15 to-brand-accent/15 blur-xl" aria-hidden="true" />
              <div className="px-4 text-brand-secondary">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="mx-auto" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M5 19.5c1.6-3.2 4.2-4.8 7-4.8s5.4 1.6 7 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <p className="mt-3 text-sm font-semibold">صورة المعلم هنا</p>
                <p className="mt-1 text-xs text-brand-muted">مقاس مقترح ٨٠٠×٨٠٠</p>
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

      {/* ── FEATURES ── */}
      <section className="border-y border-brand-border bg-brand-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-extrabold text-brand-text sm:text-3xl">
              كل ما تحتاجه لتعلّم فعّال
            </h2>
            <p className="mt-3 text-brand-muted">
              نظام تعليمي متكامل يجمع بين المحتوى المرئي والتقييم ومتابعة النتائج.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delayMs={i * 80}>
                <div className="group h-full rounded-xl border border-brand-border bg-brand-bg p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-primary/10 text-brand-primary transition-transform duration-300 group-hover:scale-110">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-brand-text">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI ASSISTANT ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <span className="rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-accent">
            جديد
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-brand-text sm:text-3xl">
            مساعدك الذكي متاح على مدار الساعة
          </h2>
          <p className="mt-3 text-brand-muted">
            علقت في مفهوم؟ اسأل مساعد أكاديميا واحصل على شرح فوري بأسلوب مبسّط، أي وقت تحتاجه.
          </p>
        </Reveal>

        <Reveal delayMs={100} className="mt-8">
          <AiAssistantDemo />
        </Reveal>
      </section>

      {/* ── CTA ── */}
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
